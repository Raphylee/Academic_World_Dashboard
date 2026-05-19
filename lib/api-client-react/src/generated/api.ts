import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions, UseQueryResult, UseMutationOptions, UseMutationResult, QueryKey } from "@tanstack/react-query";
import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";
import type {
  HealthStatus,
  KeywordCount,
  YearCount,
  DashboardStats,
  FacultyMember,
  Publication,
  KeywordTrend,
  UniversityCount,
  FacultyHindex,
  KeywordCooccurrence,
  UniversityProfile,
  FavoriteKeyword,
  FacultyKeywordScore,
  KeywordStats,
  VenueAnalysis,
  YearActivity,
  GraphData,
  ResearchPath,
  CentralityResult,
  ClusterMember,
} from "./api.schemas";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

// ─── Health ────────────────────────────────────────────────────────────────

export function useHealthCheck<TData = HealthStatus, TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<HealthStatus, TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/healthz"] as const;
  const result = useQuery<HealthStatus, TError, TData>({
    queryKey,
    queryFn: () => customFetch<HealthStatus>("/api/healthz", options?.request),
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Stats ──────────────────────────────────────────────────────────

export function useMysqlStats<TData = DashboardStats, TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<DashboardStats, TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/stats"] as const;
  const result = useQuery<DashboardStats, TError, TData>({
    queryKey,
    queryFn: () => customFetch<DashboardStats>("/api/mysql/stats", options?.request),
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Publications by year ───────────────────────────────────────────

export function useMysqlPublicationsByYear<TData = YearCount[], TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<YearCount[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/publications-by-year"] as const;
  const result = useQuery<YearCount[], TError, TData>({
    queryKey,
    queryFn: () => customFetch<YearCount[]>("/api/mysql/publications-by-year", options?.request),
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Top keywords ───────────────────────────────────────────────────

export function useMysqlTopKeywords<TData = KeywordCount[], TError = ErrorType<unknown>>(
  params?: { limit?: number },
  options?: { query?: UseQueryOptions<KeywordCount[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/top-keywords", params] as const;
  const result = useQuery<KeywordCount[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      return customFetch<KeywordCount[]>(`/api/mysql/top-keywords?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Faculty search ─────────────────────────────────────────────────

export function useMysqlFacultySearch<TData = FacultyMember[], TError = ErrorType<unknown>>(
  params: { q: string; limit?: number },
  options?: { query?: UseQueryOptions<FacultyMember[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/faculty-search", params] as const;
  const result = useQuery<FacultyMember[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("q", params.q);
      if (params.limit != null) qs.set("limit", String(params.limit));
      return customFetch<FacultyMember[]>(`/api/mysql/faculty-search?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Faculty publications ───────────────────────────────────────────

export function useMysqlFacultyPublications<TData = Publication[], TError = ErrorType<unknown>>(
  params: { facultyId: number; limit?: number },
  options?: { query?: UseQueryOptions<Publication[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/faculty-publications", params] as const;
  const result = useQuery<Publication[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("facultyId", String(params.facultyId));
      if (params.limit != null) qs.set("limit", String(params.limit));
      return customFetch<Publication[]>(`/api/mysql/faculty-publications?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Keyword trend ──────────────────────────────────────────────────

export function useMysqlKeywordTrend<TData = KeywordTrend[], TError = ErrorType<unknown>>(
  params: { keyword: string },
  options?: { query?: UseQueryOptions<KeywordTrend[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/keyword-trend", params] as const;
  const result = useQuery<KeywordTrend[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("keyword", params.keyword);
      return customFetch<KeywordTrend[]>(`/api/mysql/keyword-trend?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Top universities ───────────────────────────────────────────────

export function useMysqlTopUniversities<TData = UniversityCount[], TError = ErrorType<unknown>>(
  params?: { limit?: number },
  options?: { query?: UseQueryOptions<UniversityCount[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/top-universities", params] as const;
  const result = useQuery<UniversityCount[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      return customFetch<UniversityCount[]>(`/api/mysql/top-universities?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Faculty H-index ────────────────────────────────────────────────

export function useMysqlFacultyHindex<TData = FacultyHindex[], TError = ErrorType<unknown>>(
  params?: { limit?: number },
  options?: { query?: UseQueryOptions<FacultyHindex[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/faculty-hindex", params] as const;
  const result = useQuery<FacultyHindex[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      return customFetch<FacultyHindex[]>(`/api/mysql/faculty-hindex?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Keyword co-occurrence ─────────────────────────────────────────

export function useMysqlKeywordCooccurrence<TData = KeywordCooccurrence[], TError = ErrorType<unknown>>(
  params: { keyword: string; limit?: number },
  options?: { query?: UseQueryOptions<KeywordCooccurrence[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/keyword-cooccurrence", params] as const;
  const result = useQuery<KeywordCooccurrence[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("keyword", params.keyword);
      if (params.limit != null) qs.set("limit", String(params.limit));
      return customFetch<KeywordCooccurrence[]>(`/api/mysql/keyword-cooccurrence?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: University profile ─────────────────────────────────────────────

export function useMysqlUniversityProfile<TData = UniversityProfile[], TError = ErrorType<unknown>>(
  params?: { limit?: number },
  options?: { query?: UseQueryOptions<UniversityProfile[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/university-profile", params] as const;
  const result = useQuery<UniversityProfile[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      return customFetch<UniversityProfile[]>(`/api/mysql/university-profile?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── MySQL: Favorite keywords ──────────────────────────────────────────────

export function useMysqlGetFavoriteKeywords<TData = FavoriteKeyword[], TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<FavoriteKeyword[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mysql/favorite-keywords"] as const;
  const result = useQuery<FavoriteKeyword[], TError, TData>({
    queryKey,
    queryFn: () => customFetch<FavoriteKeyword[]>("/api/mysql/favorite-keywords", options?.request),
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useMysqlAddFavoriteKeyword<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<FavoriteKeyword, TError, { keyword: string }>
): UseMutationResult<FavoriteKeyword, TError, { keyword: string }> {
  return useMutation<FavoriteKeyword, TError, { keyword: string }>({
    mutationFn: (body) =>
      customFetch<FavoriteKeyword>("/api/mysql/favorite-keywords", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    ...options,
  });
}

export function useMysqlDeleteFavoriteKeyword<TError = ErrorType<unknown>>(
  options?: UseMutationOptions<{ success: boolean }, TError, number>
): UseMutationResult<{ success: boolean }, TError, number> {
  return useMutation<{ success: boolean }, TError, number>({
    mutationFn: (id) =>
      customFetch<{ success: boolean }>(`/api/mysql/favorite-keywords/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
}

// ─── MongoDB ───────────────────────────────────────────────────────────────

export function useMongoPublicationDetails<TData = Publication[], TError = ErrorType<unknown>>(
  params: { q: string; limit?: number },
  options?: { query?: UseQueryOptions<Publication[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mongo/publication-details", params] as const;
  const result = useQuery<Publication[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("q", params.q);
      if (params.limit != null) qs.set("limit", String(params.limit));
      return customFetch<Publication[]>(`/api/mongo/publication-details?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useMongoFacultyKeywordScores<TData = FacultyKeywordScore[], TError = ErrorType<unknown>>(
  params: { keyword: string; limit?: number },
  options?: { query?: UseQueryOptions<FacultyKeywordScore[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mongo/faculty-keyword-scores", params] as const;
  const result = useQuery<FacultyKeywordScore[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("keyword", params.keyword);
      if (params.limit != null) qs.set("limit", String(params.limit));
      return customFetch<FacultyKeywordScore[]>(`/api/mongo/faculty-keyword-scores?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useMongoKeywordStats<TData = KeywordStats, TError = ErrorType<unknown>>(
  params: { keyword: string },
  options?: { query?: UseQueryOptions<KeywordStats, TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mongo/keyword-stats", params] as const;
  const result = useQuery<KeywordStats, TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("keyword", params.keyword);
      return customFetch<KeywordStats>(`/api/mongo/keyword-stats?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useMongoYearActivity<TData = YearActivity[], TError = ErrorType<unknown>>(
  params?: { keyword?: string },
  options?: { query?: UseQueryOptions<YearActivity[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mongo/year-activity", params] as const;
  const result = useQuery<YearActivity[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.keyword) qs.set("keyword", params.keyword);
      return customFetch<YearActivity[]>(`/api/mongo/year-activity?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useMongoVenueAnalysis<TData = VenueAnalysis[], TError = ErrorType<unknown>>(
  params?: { limit?: number },
  options?: { query?: UseQueryOptions<VenueAnalysis[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mongo/venue-analysis", params] as const;
  const result = useQuery<VenueAnalysis[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      return customFetch<VenueAnalysis[]>(`/api/mongo/venue-analysis?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useMongoTopCited<TData = Publication[], TError = ErrorType<unknown>>(
  params?: { limit?: number },
  options?: { query?: UseQueryOptions<Publication[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/mongo/top-cited", params] as const;
  const result = useQuery<Publication[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      return customFetch<Publication[]>(`/api/mongo/top-cited?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

// ─── Neo4j ─────────────────────────────────────────────────────────────────

export function useNeo4jCollaborationNetwork<TData = GraphData, TError = ErrorType<unknown>>(
  params: { facultyName: string; depth?: number },
  options?: { query?: UseQueryOptions<GraphData, TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/neo4j/collaboration-network", params] as const;
  const result = useQuery<GraphData, TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("facultyName", params.facultyName);
      if (params.depth != null) qs.set("depth", String(params.depth));
      return customFetch<GraphData>(`/api/neo4j/collaboration-network?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useNeo4jFacultyKeywords<TData = string[], TError = ErrorType<unknown>>(
  params: { facultyName: string },
  options?: { query?: UseQueryOptions<string[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/neo4j/faculty-keywords", params] as const;
  const result = useQuery<string[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("facultyName", params.facultyName);
      return customFetch<string[]>(`/api/neo4j/faculty-keywords?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useNeo4jResearchPath<TData = ResearchPath, TError = ErrorType<unknown>>(
  params: { from: string; to: string },
  options?: { query?: UseQueryOptions<ResearchPath, TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/neo4j/research-path", params] as const;
  const result = useQuery<ResearchPath, TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("from", params.from);
      qs.set("to", params.to);
      return customFetch<ResearchPath>(`/api/neo4j/research-path?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useNeo4jNetworkCentrality<TData = CentralityResult[], TError = ErrorType<unknown>>(
  params?: { limit?: number },
  options?: { query?: UseQueryOptions<CentralityResult[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/neo4j/network-centrality", params] as const;
  const result = useQuery<CentralityResult[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      return customFetch<CentralityResult[]>(`/api/neo4j/network-centrality?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}

export function useNeo4jResearchClusters<TData = ClusterMember[], TError = ErrorType<unknown>>(
  params: { keyword: string; limit?: number },
  options?: { query?: UseQueryOptions<ClusterMember[], TError, TData>; request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = ["/api/neo4j/research-clusters", params] as const;
  const result = useQuery<ClusterMember[], TError, TData>({
    queryKey,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("keyword", params.keyword);
      if (params.limit != null) qs.set("limit", String(params.limit));
      return customFetch<ClusterMember[]>(`/api/neo4j/research-clusters?${qs}`, options?.request);
    },
    ...options?.query,
  });
  return { ...result, queryKey };
}
