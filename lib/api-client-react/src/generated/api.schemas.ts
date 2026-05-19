export interface HealthStatus {
  status: string;
}

export interface KeywordCount {
  keyword: string;
  count: number;
}

export interface YearCount {
  year: number;
  count: number;
}

export interface DashboardStats {
  facultyCount: number;
  publicationCount: number;
  keywordCount: number;
  totalCitations: number;
}

export interface FacultyMember {
  id: number;
  name: string;
  position?: string;
  university?: string;
  email?: string;
  photoUrl?: string;
}

export interface Publication {
  id: number | string;
  title: string;
  year?: number;
  numCitations?: number;
  venue?: string;
  abstract?: string;
  keywords?: string[];
}

export interface KeywordTrend {
  year: number;
  count: number;
}

export interface UniversityCount {
  university: string;
  count: number;
}

export interface FacultyHindex {
  name: string;
  university?: string;
  hindex: number;
}

export interface KeywordCooccurrence {
  keyword: string;
  count: number;
}

export interface UniversityProfile {
  university: string;
  facultyCount: number;
  avgCitations: number;
  publicationCount: number;
}

export interface FavoriteKeyword {
  id: number;
  keyword: string;
  createdAt?: string;
}

export interface FacultyKeywordScore {
  name: string;
  affiliation?: string;
  score?: number;
}

export interface KeywordStats {
  keyword: string;
  totalPublications: number;
  totalCitations: number;
  avgCitations: number;
}

export interface VenueAnalysis {
  venue: string;
  count: number;
  avgCitations: number;
}

export interface YearActivity {
  year: number;
  count: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  university?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ResearchPath {
  path: string[];
  length: number;
}

export interface CentralityResult {
  name: string;
  university?: string;
  degree: number;
  sharedPubs: number;
}

export interface ClusterMember {
  name: string;
  university?: string;
  score: number;
}
