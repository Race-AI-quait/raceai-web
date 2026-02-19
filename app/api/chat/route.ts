import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { dataService } from "@/lib/data-service";
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'debug_route.log');

function logDebug(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  let payload = "";
  if (data instanceof Error) {
    payload = JSON.stringify({ message: data.message, stack: data.stack });
  } else if (data !== undefined) {
    try {
      payload = JSON.stringify(data);
    } catch {
      payload = String(data);
    }
  }
  const logEntry = `[${timestamp}] ${message} ${payload}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

/* --------------------------------------------------------
   SAFE JSON PARSER (AUTO-REPAIR)
--------------------------------------------------------- */
function safeParse(jsonString: string) {
  // 1. Fast path: check if it looks like JSON
  const cleaned = jsonString.trim();
  if (!cleaned.startsWith("[") && !cleaned.startsWith("{")) {
    return null; // Not JSON, fallback to text
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // 2. Attempt repair only if it looked like JSON but failed
    console.warn("Initial JSON parse failed. Attempting auto-repair...");

    let repaired = cleaned
      .replace(/,\s*}/g, "}")       // remove trailing commas
      .replace(/,\s*]/g, "]")       // remove trailing commas
      .replace(/“|”/g, '"')         // smart quotes → "
      .replace(/‘|’/g, "'")         // smart single quotes → '
      .replace(/(\w+):/g, '"$1":')  // non-quoted keys → quoted
      .replace(/[\n\r\t]/g, " ");   // remove newlines

    try {
      return JSON.parse(repaired);
    } catch (err2) {
      // Quiet failure - we will fallback to text anyway
      return null;
    }
  }
}

/* --------------------------------------------------------
   BLOCK VALIDATOR
--------------------------------------------------------- */
function validateBlocks(blocks: any): boolean {
  if (!Array.isArray(blocks)) return false;

  const allowed = ["paragraph", "heading", "list", "code", "image", "latex", "link"];

  for (const b of blocks) {
    if (!b || typeof b !== "object" || !b.type) return false;
    if (!allowed.includes(b.type)) return false;

    if (b.type === "heading" && typeof b.level !== "number") return false;
    if (b.type === "paragraph" && typeof b.text !== "string") return false;
    if (b.type === "list" && !Array.isArray(b.items)) return false;
    if (b.type === "code" && typeof b.code !== "string") return false;
  }

  return true;
}

/* --------------------------------------------------------
   TAVILY SEARCH
--------------------------------------------------------- */
async function fetchResources(query: string) {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        max_results: 3,
        include_domains: [
          "arxiv.org",
          "scholar.google.com",
          "pubmed.ncbi.nlm.nih.gov",
          "nature.com",
          "science.org",
        ],
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();

    return (data.results || []).slice(0, 3).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }));
  } catch (err) {
    console.error("Tavily Error:", err);
    return [];
  }
}

/* --------------------------------------------------------
   PROVIDER SELECTOR
--------------------------------------------------------- */
function getModel(modelId: string) {
  if (modelId.startsWith("claude")) {
    return anthropic(modelId);
  }
  if (modelId.startsWith("gemini")) {
    return google(modelId);
  }
  if (modelId.startsWith("mistral") || modelId.startsWith("mixtral")) {
    return mistral(modelId);
  }
  // Default to OpenAI for "gpt-*" and "o1-*" or fallbacks
  return openai(modelId);
}

/* --------------------------------------------------------
   POST /api/chat
--------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = "gpt-4o", includeResources = true, systemInstruction, sessionId, projectId } = body;

    const last = messages[messages.length - 1];

    // 1. Ensure Session Exists
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      logDebug('Creating new session', { projectId });
      // Create new session
      const title = typeof last.content === 'string'
        ? last.content.substring(0, 50)
        : "New Chat";

      const newChat = await dataService.createChat({
        title,
        projectId,
        owner_id: "user-1", // Should come from session/auth
      });
      currentSessionId = newChat.id;
      logDebug('New session created', { currentSessionId });
    } else {
      logDebug('Using existing session', { currentSessionId });
    }


    // 2. Save User Message
    const isUserMessage = last.role === 'user' || last.sender === 'user';
    if (isUserMessage) {
      logDebug('Saving user message', { role: last.role, sender: last.sender, senderId: "user-1" });
      try {
        await dataService.addMessage(currentSessionId, {
          role: 'user',
          content: typeof last.content === 'string' ? last.content : JSON.stringify(last.content),
          senderId: "user-1"
        });
        logDebug('User message saved successfully');
      } catch (e) {
        logDebug('Failed to save user message', e);
        // CRITICAL: Fail here to prevent inconsistent state
        return NextResponse.json(
          { error: "Failed to save user message. Please try again." },
          { status: 500 }
        );
      }
    } else {
      logDebug('Skipping user message save - not identified as user', { role: last.role, sender: last.sender });
    }

    /* -----------------------------
       Convert UI messages → LLM messages
    ----------------------------- */
    const formattedMessages = messages.map((m: any) => ({
      role: m.sender === "assistant" ? "assistant" : "user",
      content: m.content ?? "",
    }));

    /* -----------------------------
       Fetch resources (Tavily)
    ----------------------------- */
    let resources: any[] = [];
    const lastContent = last?.content;
    let searchQuery = "";

    if (typeof lastContent === "string") {
      searchQuery = lastContent;
    } else if (Array.isArray(lastContent)) {
      // Extract text parts
      searchQuery = lastContent
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join(" ");
    }

    if (includeResources && searchQuery) {
      logDebug('Fetching resources for', searchQuery);
      resources = await fetchResources(searchQuery);
      logDebug('Resources fetched', { count: resources.length });
    }

    /* -----------------------------
       Request LLM with Streaming
    ----------------------------- */
    const modelInstance = getModel(model);

    // Combine custom persona instruction (No JSON enforcement needed for streaming text)
    const defaultResearchPrompt = [
      "You are Ri, the research copilot for the RACE AI platform.",
      "Responsibilities:",
      "1. Interpret every query as a research or technical task. Provide structured, rigorous answers.",
      "2. When the user supplies files or images, describe the key observations from that artifact before drawing conclusions.",
      "3. Reply with sections: Summary, Technical Details (bullet or numbered when helpful), and Next Steps/Recommendations.",
      "4. Reference any cited sources or caller-provided context explicitly. If information is missing, state assumptions or ask a clarifying question after giving your best analysis.",
      "5. Math must use $inline$ or $$block$$ LaTeX delimiters. Keep tone professional and concise."
    ].join(" ");
    const baseSystemPrompt = systemInstruction || defaultResearchPrompt;

    // Inject resources if found
    let finalSystemPrompt = baseSystemPrompt;
    if (resources.length > 0) {
      const resourceContext = resources.map(r => `[${r.title}](${r.url}): ${r.snippet}`).join("\n\n");
      finalSystemPrompt += `\n\nUse the following context to answer if relevant:\n${resourceContext}`;
    }

    // Use streamText instead of generateText
    const result = await streamText({
      model: modelInstance as any,
      system: finalSystemPrompt,
      messages: formattedMessages,
      onFinish: async (completion: any) => {
        // 3. Save Assistant Message on Finish
        const finalContentPayload = resources.length > 0
          ? JSON.stringify({ content: completion.text, resources })
          : completion.text;

        await dataService.addMessage(currentSessionId, {
          role: 'assistant',
          content: finalContentPayload
        });
      }
    });

    // Get the base stream response
    const response = result.toTextStreamResponse();

    // Create a new response with the resources header AND Session ID
    // We clone the headers and add ours
    const headers = new Headers(response.headers);
    if (resources && resources.length > 0) {
      // Base64 encode to avoid invalid header characters (e.g. unicode)
      const encodedResources = Buffer.from(JSON.stringify(resources)).toString('base64');
      headers.set("X-RaceAI-Resources", encodedResources);
    }
    // Return Session ID so client can update URL/State
    headers.set("X-Session-Id", currentSessionId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
