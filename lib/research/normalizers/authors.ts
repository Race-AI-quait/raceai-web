
import { Researcher } from "../types";

export function normalizeResearchersFromOpenAlex(works: any[]): Researcher[] {
    // Extract authors from works since we didn't fetch them separately 
    // Or if we implemented fetchOpenAlexBundle to return authors, use those.
    // Assuming passed works or authors list. Let's assume we pass a list of *Authors* from OpenAlex if we had them,
    // but our current OpenAlex integration returns 'authors' array which was empty.
    // So we might extract from works.

    // Let's change signature to accept works and extract top authors? 
    // Or assume the integration will be improved. 
    // For now, let's extract from works.

    const authorMap = new Map<string, Researcher>();

    works.forEach(w => {
        w.authorships?.forEach((a: any) => {
            const id = a.author.id;
            if (!authorMap.has(id)) {
                authorMap.set(id, {
                    id: id,
                    name: a.author.display_name,
                    affiliation: a.institutions?.[0]?.display_name,
                    profileUrl: a.author.id, // OpenAlex ID is a URL
                    source: "openalex",
                    totalCitations: 0 // We'd need to sum this or fetch author details
                });
            }
            // Simple accumulation from what we see
            const r = authorMap.get(id)!;
            r.totalCitations = (r.totalCitations || 0) + (w.cited_by_count || 0);
        });
    });

    return Array.from(authorMap.values());
}

export function normalizeResearchersFromSemanticScholar(rawAuthors: any[]): Researcher[] {
    return rawAuthors.map((a: any) => ({
        id: a.authorId,
        name: a.name,
        affiliation: a.affiliations?.[0], // simple access
        totalCitations: a.citationCount,
        hIndex: a.hIndex,
        profileUrl: a.url,
        source: "semanticscholar"
    }));
}

export function mergeAndRankResearchers(
    r1: Researcher[],
    r2: Researcher[]
): Researcher[] {
    const all = [...r1, ...r2];
    // Dedup
    const seen = new Set<string>();
    const unique: Researcher[] = [];
    all.forEach(r => {
        if (!seen.has(r.name)) { // Name collision risk but acceptable for MVP
            seen.add(r.name);
            unique.push(r);
        }
    });

    return unique.sort((a, b) => (b.totalCitations || 0) - (a.totalCitations || 0)).slice(0, 10);
}
