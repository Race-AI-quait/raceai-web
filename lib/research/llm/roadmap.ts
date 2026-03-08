
import type { RoadmapSection, Paper, Topic, Researcher } from "../types";

export async function buildRoadmap(
    query: string,
    context?: {
        topics?: Topic[];
        papers?: Paper[];
        researchers?: Researcher[];
    }
): Promise<RoadmapSection[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        // Return a static mock if no API key to avoid breaking the UI during dev without keys
        return [
            {
                title: "Foundations",
                description: "Core concepts needed to understand the field.",
                items: [
                    { title: "Introduction to " + query, description: "Basic terminology and history." },
                    { title: "Key Mathematical Principles", description: "Essential math background." }
                ]
            },
            {
                title: "Intermediate",
                description: "Deepening knowledge with standard techniques.",
                items: [
                    { title: "Standard Methodologies", description: "Common approaches used in " + query }
                ]
            },
            {
                title: "Frontier",
                description: "Current state of the art.",
                items: [
                    { title: "Open Problems", description: "Unsolved challenges in " + query }
                ]
            }
        ];
    }

    try {
        const prompt = `You are an expert research mentor. Given the field "${query}" and these subtopics/papers/researchers context: ${JSON.stringify(context || {}).slice(0, 1000)}..., produce a 3–4 phase learning roadmap: [Foundations, Intermediate, Research Level, Frontier]. Each phase should have 3–6 bullet items with short descriptions. Use only the provided context plus common, standard textbooks & classic papers. Avoid hallucinating random imaginary URLs. Return ONLY valid JSON array of objects with keys: title, description, items (array of {title, description}).`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo-preview", // or gpt-3.5-turbo
                messages: [{ role: "system", content: "You are a helpful research assistant." }, { role: "user", content: prompt }],
                temperature: 0.7,
            })
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        // Parse JSON from content (handle potential markdown blocks)
        try {
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent);
        } catch (e) {
            console.error("Failed to parse LLM roadmap JSON", e);
            return [];
        }

    } catch (error) {
        console.error("LLM Roadmap Error:", error);
        return [];
    }
}
