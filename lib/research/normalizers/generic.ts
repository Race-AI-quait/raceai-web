
import { NewsItem, FundingCall } from "../types";

export function normalizeNews(articles: any[]): NewsItem[] {
    return articles.map((a: any, i) => ({
        id: a.url || `news-${i}`,
        title: a.title,
        url: a.url,
        sourceName: a.source?.name,
        publishedAt: a.publishedAt,
        snippet: a.description
    }));
}

export function normalizeFunding(projects: any[]): FundingCall[] {
    return projects.map((p: any, i) => ({
        id: p.project_num || `fund-${i}`,
        title: p.project_title,
        agency: p.agency_ic_fund_group_code,
        piName: p.contact_pi_name,
        institution: p.org_name,
        amount: p.award_amount,
        startDate: p.project_start_date,
        endDate: p.project_end_date
    }));
}
