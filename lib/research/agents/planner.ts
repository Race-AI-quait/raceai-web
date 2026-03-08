import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function planSearchQueries(userStatement: string): Promise<string[]> {
    try {
        const { object } = await generateObject({
            model: openai("gpt-4o"),
            schema: z.object({
                queries: z.array(z.string()).describe("A list of 3-5 highly optimized search queries for academic databases (Arxiv, Semantic Scholar, OpenAlex) based on the user's complex research statement."),
            }),
            prompt: `You are an expert research librarian and academic search string optimizer.
      
The user wants to conduct a 'Deep Research' sweep across academic databases using the following complex problem statement or idea:
"${userStatement}"

Your task is to analyze this statement and formulate 3 to 5 highly effective search queries. These queries will be directly fed into OpenAlex, Semantic Scholar, and Arxiv APIs.
- Do NOT use complex boolean operators (AND/OR) if they break standard string searching. 
- DO extract the core keywords, concepts, and synonyms.
- Ensure the queries cover both broad and highly specific angles of the user's statement.`,
        });

        return object.queries;
    } catch (error) {
        console.error("Error in Query Planning Agent:", error);
        // Fallback to the direct query if the LLM fails
        return [userStatement];
    }
}
