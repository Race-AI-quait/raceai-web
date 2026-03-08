import { planSearchQueries } from "@/lib/research/agents/planner";
import { filterRelevantPapers } from "@/lib/research/agents/filter";
import { synthesizeEdgeProblems } from "@/lib/research/agents/edgeProblems";
import { fetchOpenAlexBundle } from "@/lib/research/integrations/openalex";
import { fetchSemanticScholarBundle } from "@/lib/research/integrations/semanticscholar";
import { fetchArxivBundle } from "@/lib/research/integrations/arxiv";
import { fetchFundingBundle } from "@/lib/research/integrations/funding_nih";
import { fetchNewsBundle } from "@/lib/research/integrations/news_gnews";
import { buildRoadmap } from "@/lib/research/llm/roadmap";
import {
    normalizePapersFromOpenAlex,
    normalizePapersFromSemanticScholar,
    normalizePapersFromArxiv,
    mergeAndRankPapers
} from "@/lib/research/normalizers/papers";
import {
    normalizeResearchersFromOpenAlex,
    normalizeResearchersFromSemanticScholar,
    mergeAndRankResearchers
} from "@/lib/research/normalizers/authors";
import { normalizeTopicsFromOpenAlex } from "@/lib/research/normalizers/topics";
import { normalizeNews, normalizeFunding } from "@/lib/research/normalizers/generic";
import { ResearchResponse } from "@/lib/research/types";

// Helper to write SSE chunks
function emitProgress(controller: ReadableStreamDefaultController, percent: number, message: string) {
    const payload = JSON.stringify({ type: "progress", percent, message });
    controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
}

export async function POST(request: Request) {
    let query = "";
    try {
        const body = await request.json();
        query = body.query;

        if (!query || typeof query !== "string") {
            return new Response("Query is required", { status: 400 });
        }
    } catch {
        return new Response("Invalid request", { status: 400 });
    }

    const encoder = new TextEncoder();

    // We create a custom readable stream to yield SSE events
    const stream = new ReadableStream({
        async start(controller) {
            let isClosed = false;

            const safeClose = () => {
                if (!isClosed) {
                    isClosed = true;
                    try { controller.close(); } catch (e) { }
                }
            };

            const safeEnqueue = (chunk: string) => {
                if (!isClosed) {
                    try { controller.enqueue(encoder.encode(chunk)); } catch (e) { }
                }
            };

            const safeEmitProgress = (percent: number, message: string) => {
                if (!isClosed) {
                    const payload = JSON.stringify({ type: "progress", percent, message });
                    safeEnqueue(`data: ${payload}\n\n`);
                }
            };

            try {
                // PHASE 1: Query Planning
                safeEmitProgress(10, "Analyzing research statement and formulating multi-agent search strategy...");

                const searchQueries = await planSearchQueries(query);
                // use the first generated query or fallback to original for the primary exact-match search, 
                // but we could expand this to Promise.all across ALL queries if we wanted a massive footprint.
                // For performance, we'll use the top generated query to seed the DB fetches, 
                // but the LLM Planner ensures it's highly optimized.
                const optimizedQuery = searchQueries[0] || query;

                safeEmitProgress(30, `Executing optimized search strategy across global databases for: "${optimizedQuery}"...`);

                // ... (PHASE 2, 3, 4 remain unchanged)
                const [
                    openAlexData,
                    semanticData,
                    arxivData,
                    fundingData,
                    newsData
                ] = await Promise.all([
                    fetchOpenAlexBundle(optimizedQuery),
                    fetchSemanticScholarBundle(optimizedQuery),
                    fetchArxivBundle(optimizedQuery),
                    fetchFundingBundle(optimizedQuery),
                    fetchNewsBundle(optimizedQuery)
                ]);

                safeEmitProgress(50, "Aggregating and normalizing retrieved scholarly articles...");

                // Normalize base data
                const openAlexPapers = normalizePapersFromOpenAlex(openAlexData.works);
                const semanticPapers = normalizePapersFromSemanticScholar(semanticData.papers);
                const arxivPapers = normalizePapersFromArxiv(arxivData.papers);

                const { stateOfTheArt: rawSota, recentGroundbreaking: rawRecent } = mergeAndRankPapers(
                    openAlexPapers,
                    semanticPapers,
                    arxivPapers
                );

                const openAlexResearchers = normalizeResearchersFromOpenAlex(openAlexData.works);
                const semanticResearchers = normalizeResearchersFromSemanticScholar(semanticData.authors);
                const topResearchers = mergeAndRankResearchers(openAlexResearchers, semanticResearchers);

                const topics = normalizeTopicsFromOpenAlex(openAlexData.concepts);
                const news = normalizeNews(newsData.articles);
                const funding = normalizeFunding(fundingData.projects);

                // PHASE 3: Relevance Filtering
                safeEmitProgress(65, "Agent filtering and ranking papers for maximum relevance to your statement...");

                const targetPaperCount = Math.max(15, rawSota.length); // Try to get top 15-20 candidates
                const stateOfTheArt = await filterRelevantPapers(query, rawSota.slice(0, 30));

                // Fallback if filter is too aggressive
                const finalSota = stateOfTheArt.length > 0 ? stateOfTheArt : rawSota.slice(0, 15);
                const recentGroundbreaking = rawRecent.slice(0, 10); // keep recent fast

                // PHASE 4: Edge Problem Synthesis
                safeEmitProgress(80, "Deep reading top abstracts to synthesize unaddressed Edge Problems...");

                const edgeProblems = await synthesizeEdgeProblems(query, finalSota.slice(0, 10));

                // PHASE 5: Roadmap Generation
                safeEmitProgress(90, "LLM Agent mapping a comprehensive learning and research roadmap...");

                const roadmap = await buildRoadmap(query, {
                    topics: topics.slice(0, 5),
                    papers: finalSota.slice(0, 5),
                    researchers: topResearchers.slice(0, 5)
                });

                safeEmitProgress(99, "Finalizing payload...");

                // construct final response
                const responsePayload: ResearchResponse = {
                    query,
                    stateOfTheArt: finalSota,
                    recentGroundbreaking,
                    topics,
                    topResearchers,
                    news,
                    funding,
                    roadmap,
                    edgeProblems
                };

                // send final result event
                const finalData = JSON.stringify({ type: "result", data: responsePayload });
                safeEnqueue(`data: ${finalData}\n\n`);

                safeClose();
            } catch (error) {
                console.error("API Route Pipeline Error:", error);
                const errorPayload = JSON.stringify({ type: "error", message: "Internal Server Error during pipeline execution." });
                safeEnqueue(`data: ${errorPayload}\n\n`);
                safeClose();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    });
}
