
export async function fetchOpenAlexBundle(query: string): Promise<{
    works: any[];
    concepts: any[];
    authors: any[];
}> {
    try {
        // Construct the URL for searching works
        // Using "search" parameter for full-text search
        const worksUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=10`;
        const conceptsUrl = `https://api.openalex.org/concepts?search=${encodeURIComponent(query)}&per-page=10`;

        const [worksRes, conceptsRes] = await Promise.all([
            fetch(worksUrl),
            fetch(conceptsUrl)
        ]);

        const worksData = await worksRes.json();
        const conceptsData = await conceptsRes.json();

        // Optionally fetch authors from the top works logic could go here, 
        // but for now we'll just extract them during normalization or return empty if not separately fetched.
        // The prompt suggests "Search for works... Search for concepts... Optionally fetch top authors".
        // Authors are embedded in works usually, but let's see. 
        // We will return empty authors array here and rely on works' authorship or separate call if needed.
        // Actually, let's just return what we have. API orchestration can handle specifics.

        return {
            works: worksData.results || [],
            concepts: conceptsData.results || [],
            authors: [] // If we want specific author search, we'd add it.
        };
    } catch (error) {
        console.error("OpenAlex Fetch Error:", error);
        return { works: [], concepts: [], authors: [] };
    }
}
