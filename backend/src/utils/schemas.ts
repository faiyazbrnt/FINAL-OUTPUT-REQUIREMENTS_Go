import { z } from "zod";

export const topCategoriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

export const trendQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bucketSize: z.coerce.number().int().min(5).max(30).default(10)
});

export const insightRequestSchema = z.object({
  summary: z.record(z.string(), z.unknown()).optional(),
  maxWords: z.coerce.number().int().min(60).max(220).default(150)
});

