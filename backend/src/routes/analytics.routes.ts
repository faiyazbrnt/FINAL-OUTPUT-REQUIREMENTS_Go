import { Router } from "express";
import {
  getKpis,
  getRegionalDistribution,
  getTopCategories,
  getTrend
} from "../controllers/analytics.controller";
import { validate } from "../middleware/validate.middleware";
import { topCategoriesQuerySchema, trendQuerySchema } from "../utils/schemas";

const analyticsRouter = Router();

analyticsRouter.get("/kpis", getKpis);
analyticsRouter.get("/top-categories", validate(topCategoriesQuerySchema, "query"), getTopCategories);
analyticsRouter.get("/regional-distribution", getRegionalDistribution);
analyticsRouter.get("/trend", validate(trendQuerySchema, "query"), getTrend);

export default analyticsRouter;

