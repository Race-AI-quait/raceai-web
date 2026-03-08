import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Paper } from "../types";

export async function filterRelevantPapers(userStatement: string, papers: Paper[]): Promise<Paper[]> {
    if (papers.length === 0) return [];
    if (papers.length <= 30) return papers; // Don't filter if we naturally have very few, allows lists to populate

    try {
        // To save tokens and time, we map papers to a slim abstract-only dictionary
        const paperMap = papers.map((p, index) => ({
            index,
            title: p.title,
            abstract: p.abstract ? p.abstract.substring(0, 800) : "No abstract available.", // Trim long abstracts
        }));

        const { object } = await generateObject({
            model: openai("gpt-4o-mini"), // mini is faster and cheaper for bulk classification
            schema: z.object({
                highlyRelevantIndices: z.array(z.number()).describe("An array of indices (integers) corresponding to the papers that are highly relevant to the problem statement."),
            }),
            prompt: `You are an expert peer reviewer and research analyst.

The user is researching the following complex problem statement or idea:
"${userStatement}"

Below is a JSON array of academic papers retrieved from scholarly databases. Each object contains an 'index', 'title', and a brief 'abstract'.
Your task is to analyze these papers and return ONLY the indices of the papers that are HIGHLY RELEVANT and DIRECTLY APPLICABLE to the user's specific problem statement.
Ignore tangential or weakly related papers. We want a concentrated, high-quality list. 

Papers to evaluate:
${JSON.stringify(paperMap, null, 2)}
`,
        });

        // Map indices back to full paper objects
        const relevantIndices = new Set(object.highlyRelevantIndices);
        const filtered = papers.filter((_, i) => relevantIndices.has(i));

        // If the LLM filtered out everything (or failed), fallback to returning the top 15 sorted by citation
        if (filtered.length === 0) {
            return papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0)).slice(0, 15);
        }

        return filtered;

    } catch (error) {
        console.error("Error in Relevance Filtering Agent:", error);
        // Fallback: simply return the top 15 by citation count
        return papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0)).slice(0, 15);
    }
}
