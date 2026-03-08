
export async function fetchNewsBundle(query: string): Promise<{
    articles: any[];
}> {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
        // console.warn("No NEWS_API_KEY provided");
        return { articles: [] };
    }

    try {
        // Using GNews as example: https://gnews.io/api/v4/search?q=example&apikey=API_KEY
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query + " research")}&lang=en&max=5&apikey=${apiKey}`;

        const res = await fetch(url);
        if (!res.ok) {
            // try fallback to NewsAPI if GNews fails or format differs? 
            // We'll stick to one interface.
            console.error("News API Error:", res.status);
            return { articles: [] };
        }

        const data = await res.json();
        return { articles: data.articles || [] };
    } catch (error) {
        console.error("News Fetch Error:", error);
        return { articles: [] };
    }
}
