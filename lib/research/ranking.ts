
import { Paper } from "./types";

export function computeSotaScore(p: Paper): number {
    // Heuristic: High citations + recent-ish (last 10 years)
    const age = new Date().getFullYear() - (p.year || 2020);
    const citationScore = Math.log10((p.citationCount || 0) + 1);

    if (age > 15) return citationScore * 0.5; // Penalize very old papers
    return citationScore;
}

export function computeGroundbreakingScore(p: Paper): number {
    // Heuristic: Very recent (last 3 years) + high citations relative to age
    const currentYear = new Date().getFullYear();
    const age = currentYear - (p.year || currentYear);

    if (age > 3) return 0; // Not "recent groundbreaking" if older than 3 years

    // Boost for 2024/2025 papers even with low citations
    const recencyBoost = (4 - age) * 2;
    const citationScore = Math.log10((p.citationCount || 0) + 1);

    return citationScore + recencyBoost;
}
