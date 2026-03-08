
export async function summarizePaper(abstract: string, title?: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return abstract; // Fallback to abstract

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Summarize the following paper abstract in 1-2 sentences." },
                    { role: "user", content: `Title: ${title}\nAbstract: ${abstract}` }
                ],
                max_tokens: 100
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || abstract;
    } catch (error) {
        return abstract;
    }
}
