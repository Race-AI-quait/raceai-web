
import { parseStringPromise } from 'xml2js'; // You might need to install xml2js

export async function fetchArxivBundle(query: string): Promise<{
    papers: any[];
}> {
    // arXiv API: http://export.arxiv.org/api/query?search_query=all:electron&start=0&max_results=10
    try {
        const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;
        const res = await fetch(url);
        const text = await res.text();


        const result = await parseStringPromise(text);
        const rawEntries = result.feed.entry || [];

        const papers = rawEntries.map((entry: any) => {
            const title = entry.title?.[0]?.replace(/\n/g, '').trim() || "";
            const summary = entry.summary?.[0]?.replace(/\n/g, '').trim() || "";
            const published = entry.published?.[0] || "";
            const id = entry.id?.[0] || "";
            const authors = entry.author?.map((a: any) => a.name?.[0]) || [];
            const link = entry.link?.find((l: any) => l.$.title === 'pdf')?.$.href || entry.id?.[0] || "";

            return {
                title,
                summary,
                published,
                id,
                authors,
                link,
                source: 'arxiv'
            };
        });

        return { papers };
    } catch (error) {
        console.error("ArXiv Fetch Error:", error);
        return { papers: [] };
    }
}
