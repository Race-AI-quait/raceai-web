
export async function fetchSemanticScholarBundle(query: string): Promise<{
    papers: any[];
    authors: any[];
}> {
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;

    // If no key, maybe return empty or try public (limited). 
    // Semantic Scholar usually requires key for higher limits, but let's try.
    // Endpoint: https://api.semanticscholar.org/graph/v1/paper/search

    try {
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=title,authors,venue,year,citationCount,abstract,url`;
        const headers: HeadersInit = {};
        if (apiKey) {
            headers['x-api-key'] = apiKey;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
            console.error("Semantic Scholar Error:", res.status, res.statusText);
            return { papers: [], authors: [] };
        }

        const data = await res.json();

        // We could also search for authors: https://api.semanticscholar.org/graph/v1/author/search
        const authorUrl = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(query)}&limit=5&fields=name,citationCount,hIndex,affiliations,url`;
        const authorRes = await fetch(authorUrl, { headers });
        const authorData = await authorRes.json();

        return {
            papers: data.data || [],
            authors: authorData.data || []
        };
    } catch (error) {
        console.error("Semantic Scholar Fetch Error:", error);
        return { papers: [], authors: [] };
    }
}
