import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getAnalyticsSummary } from "../services/analytics.service";
import { generateAiInsight } from "../services/ai.service";

export const generateInsight = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { summary?: Record<string, unknown>; maxWords: number };
  const summary = body.summary ?? (await getAnalyticsSummary());
  const { insight, fallbackUsed, structuredInsights, recommendations } = await generateAiInsight(summary, body.maxWords);

  res.status(200).json({
    success: true,
    data: {
      insight,
      fallbackUsed,
      structuredInsights,
      recommendations
    }
  });
});

