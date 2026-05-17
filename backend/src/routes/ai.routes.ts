import { Router } from "express";
import { generateInsight } from "../controllers/ai.controller";
import { aiRateLimit } from "../middleware/aiRateLimit.middleware";
import { validate } from "../middleware/validate.middleware";
import { insightRequestSchema } from "../utils/schemas";

const aiRouter = Router();

aiRouter.post("/insight", aiRateLimit, validate(insightRequestSchema, "body"), generateInsight);

export default aiRouter;

