
import { Paper } from "../types";
import { computeSotaScore, computeGroundbreakingScore } from "../ranking";

function reconstructAbstract(invertedIndex: any): string | undefined {
    if (!invertedIndex) return undefined;
    try {
        const words: string[] = [];
        for (const [word, positions] of Object.entries(invertedIndex)) {
            if (Array.isArray(positions)) {
                for (const pos of positions) {
                    words[pos as number] = word;
                }
            }
        }
        return words.filter(Boolean).join(" ");
    } catch (e) {
        return undefined;
    }
}

export function normalizePapersFromOpenAlex(rawWorks: any[]): Paper[] {
    return rawWorks.map((w: any) => ({
        id: w.id,
        doi: w.doi,
        title: w.title,
        abstract: reconstructAbstract(w.abstract_inverted_index), // OpenAlex uses inverted index
        year: w.publication_year,
        venue: w.primary_location?.source?.display_name,
        url: w.ids?.doi || w.primary_location?.landing_page_url,
        source: "openalex",
        citationCount: w.cited_by_count,
        isPreprint: w.type === 'preprint',
        authors: w.authorships?.map((a: any) => ({
            name: a.author.display_name,
            affiliation: a.institutions?.[0]?.display_name,
            openAlexId: a.author.id
        })) || []
    }));
}

export function normalizePapersFromSemanticScholar(rawPapers: any[]): Paper[] {
    return rawPapers.map((p: any) => ({
        id: p.paperId,
        doi: p.externalIds?.DOI,
        title: p.title,
        abstract: p.abstract,
        year: p.year,
        venue: p.venue,
        url: p.url,
        source: "semanticscholar",
        citationCount: p.citationCount,
        isPreprint: false, // Default assumption, or check publication types
        authors: p.authors?.map((a: any) => ({
            name: a.name,
            semanticScholarId: a.authorId
        })) || []
    }));
}

export function normalizePapersFromArxiv(rawPapers: any[]): Paper[] {
    return rawPapers.map((p: any) => ({
        id: p.id,
        title: p.title,
        abstract: p.summary,
        year: p.published ? new Date(p.published).getFullYear() : undefined,
        url: p.link || p.id,
        source: "arxiv",
        citationCount: 0, // Arxiv doesn't provide citations easily
        isPreprint: true,
        authors: (p.authors || []).map((name: string) => ({ name }))
    }));
}

export function mergeAndRankPapers(
    openAlexPapers: Paper[],
    semanticPapers: Paper[],
    arxivPapers: Paper[]
): {
    stateOfTheArt: Paper[];
    recentGroundbreaking: Paper[];
} {
    // 1. Merge all papers
    const all = [...openAlexPapers, ...semanticPapers, ...arxivPapers];

    // 2. Deduplicate by DOI or Title
    const seen = new Set<string>();
    const unique: Paper[] = [];

    for (const p of all) {
        const key = (p.doi || p.title).toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(p);
        }
    }

    // 3. Rank
    const sota = [...unique].sort((a, b) => computeSotaScore(b) - computeSotaScore(a));
    const recent = [...unique].sort((a, b) => computeGroundbreakingScore(b) - computeGroundbreakingScore(a));

    return {
        stateOfTheArt: sota.slice(0, 10),
        recentGroundbreaking: recent.slice(0, 10)
    };
}
