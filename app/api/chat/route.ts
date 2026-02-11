import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { generateText } from "ai";

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
    const { messages, model = "gpt-4o", includeResources = true, systemInstruction } = body;

    const last = messages[messages.length - 1];

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
      resources = await fetchResources(searchQuery);
    }

    /* -----------------------------
       Request LLM with JSON-enforced format
    ----------------------------- */
    const modelInstance = getModel(model);

    // Combine custom persona instruction with strict JSON enforcement
    const baseSystemPrompt = systemInstruction || "You are JARVIS, an advanced research assistant.";
    const jsonEnforcementPrompt = `
You MUST return ONLY a JSON array named "blocks", example:

[
  { "type": "paragraph", "text": "..." },
  { "type": "heading", "level": 1, "text": "..." },
  { "type": "code", "language": "python", "code": "print('Hello')" }
]

STRICT RULES:
- No markdown
- No backticks
- No commentary
- Do NOT wrap JSON in text
- Output raw JSON ONLY
`;

    const response = await generateText({
      model: modelInstance as any,
      system: `${baseSystemPrompt}\n\n${jsonEnforcementPrompt}`,
      messages: formattedMessages,
    });

    /* -----------------------------
       Parse blocks safely
    ----------------------------- */
    let blocks = safeParse(response.text);

    if (!validateBlocks(blocks)) {
      console.warn("Invalid block output → Falling back to paragraph.");
      blocks = [
        { type: "paragraph", text: response.text }
      ];
    }

    /* -----------------------------
       Send message to UI
    ----------------------------- */
    return NextResponse.json({
      message: {
        id: Date.now().toString(),
        sender: "assistant",
        blocks,
        timestamp: new Date().toISOString(),
        resources,
      },
    });

  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
