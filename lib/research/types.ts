export interface PaperAuthorRef {
  name: string;
  affiliation?: string;
  openAlexId?: string;
  semanticScholarId?: string;
}

export interface Paper {
  id: string; // internal id
  doi?: string;
  title: string;
  abstract?: string;
  year?: number;
  venue?: string;
  url?: string;
  source: "openalex" | "semanticscholar" | "arxiv";
  citationCount?: number;
  isPreprint?: boolean;
  authors: PaperAuthorRef[];
  concepts?: string[];
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  parentName?: string;
  relevanceScore?: number;
}

export interface Researcher {
  id: string;
  name: string;
  affiliation?: string;
  totalCitations?: number;
  hIndex?: number;
  profileUrl?: string;
  source: "openalex" | "semanticscholar";
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  sourceName?: string;
  publishedAt?: string;
  snippet?: string;
}

export interface FundingCall {
  id: string;
  title: string;
  agency?: string;
  piName?: string;
  institution?: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  url?: string;
}

export interface EdgeProblem {
  title: string;
  description: string;
  relevance: string;
}

export interface RoadmapSection {
  title: string;
  description: string;
  items: { title: string; description: string }[];
}

export interface ResearchResponse {
  query: string;

  stateOfTheArt: Paper[];
  recentGroundbreaking: Paper[];
  topics: Topic[];
  topResearchers: Researcher[];
  news: NewsItem[];
  funding: FundingCall[];
  roadmap: RoadmapSection[];
  edgeProblems: EdgeProblem[];
}
