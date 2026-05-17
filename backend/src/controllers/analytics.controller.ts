import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getKpiMetrics,
  getRegionalDistributionAnalytics,
  getTopCategoriesAnalytics,
  getTrendAnalytics
} from "../services/analytics.service";

export const getKpis = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getKpiMetrics();
  res.status(200).json({ success: true, data });
});

export const getTopCategories = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as { limit: number };
  const data = await getTopCategoriesAnalytics(query.limit);
  res.status(200).json({ success: true, data });
});

export const getRegionalDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getRegionalDistributionAnalytics();
  res.status(200).json({ success: true, data });
});

export const getTrend = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as { bucketSize: number; from?: string; to?: string };
  const data = await getTrendAnalytics(query.bucketSize);

  res.status(200).json({
    success: true,
    data,
    meta: {
      note:
        query.from || query.to
          ? "Dataset has no date column, so trend is computed across age bands."
          : "Trend is computed across age bands."
    }
  });
});
