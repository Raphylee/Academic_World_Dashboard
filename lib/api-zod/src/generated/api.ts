import { z } from "zod";

export const HealthCheckResponse = z.object({
  status: z.string(),
});

export const KeywordCountSchema = z.object({
  keyword: z.string(),
  count: z.number(),
});

export const YearCountSchema = z.object({
  year: z.number(),
  count: z.number(),
});

export const DashboardStatsSchema = z.object({
  facultyCount: z.number(),
  publicationCount: z.number(),
  keywordCount: z.number(),
  totalCitations: z.number(),
});
