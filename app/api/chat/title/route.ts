import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function POST(req: Request) {
  try {
    const { prompt, model = "gpt-4o", sessionId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ title: "New Chat" });
    }

    const { text } = await generateText({
      model: openai(model), // Use a fast model if possible
      system: `You are a helpful assistant being asked to generate a title for a chat.
The user will provide the first message of the conversation.
Generate a concise (3-5 words) title that summarizes the intent.
Do not include "Title:" prefix. Do not use quotes.
Correct any typos in the user's prompt when generating the title.`,
      prompt: `User message: "${prompt}"`,
    });

    const title = text.trim().replace(/^["']|["']$/g, '');

    // If we have a sessionId, persist the title!
    if (sessionId) {
      try {
        await dataService.updateChat(sessionId, { title });
        console.log(`Title persisting for session ${sessionId}: ${title}`);
      } catch (dbError) {
        console.error("Failed to persist title to DB:", dbError);
        // We continue to return the title so the UI updates
      }
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Title Generation Error:", error);
    return NextResponse.json({ title: "New Chat" });
  }
}
