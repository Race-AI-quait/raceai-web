
import { Topic } from "../types";

export function normalizeTopicsFromOpenAlex(rawConcepts: any[]): Topic[] {
    return rawConcepts.map((c: any) => ({
        id: c.id,
        name: c.display_name,
        description: c.description || "No description available",
        relevanceScore: c.score // context score if from /works, or just level/score if from /concepts search
    }));
}
