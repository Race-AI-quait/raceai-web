import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Paper } from "../types";

export interface EdgeProblem {
    title: string;
    description: string;
    relevance: string; // Why this matters to the user's specific statement
}

export async function synthesizeEdgeProblems(userStatement: string, topPapers: Paper[]): Promise<EdgeProblem[]> {
    if (topPapers.length === 0) return [];

    try {
        const abstracts = topPapers
            .filter((p) => p.abstract && p.abstract !== "No abstract available.")
            .map((p) => `Title: ${p.title}\nAbstract: ${p.abstract}`)
            .join("\n\n---\n\n");

        const { object } = await generateObject({
            model: openai("gpt-4o"), // use powerful model for generative synthesis
            schema: z.object({
                edgeProblems: z.array(z.object({
                    title: z.string().describe("A concise specific title for the unsolved problem."),
                    description: z.string().describe("Detailed description of the gap in current literature or engineering challenges."),
                    relevance: z.string().describe("Explanation of why solving this edge problem is critical to the user's overarching research statement.")
                })).describe("A list of 3-5 unsolved edge problems synthesized from the state of the art."),
            }),
            prompt: `You are an elite, world-class principal roboticist/research scientist.

The user is proposing the following research statement/idea:
"${userStatement}"

Below are the titles and abstracts of the absolute bleeding-edge 'State of the Art' papers related to their idea:
${abstracts}

Your task is to synthesize the current boundary of human knowledge in this niche. Identify the "Edge Problems":
- What are the explicit limitations mentioned in these state-of-the-art papers?
- What are the unsolved challenges preventing the ultimate realization of the user's idea?
- Where should the user focus their novel research efforts to push the boundary forward?

Extract and synthesize 3 to 5 critical Edge Problems. Be technical, highly specific, and rigorously academic.`,
        });

        return object.edgeProblems;
    } catch (error) {
        console.error("Error in Edge Problem Synthesis Agent:", error);
        return [];
    }
}
