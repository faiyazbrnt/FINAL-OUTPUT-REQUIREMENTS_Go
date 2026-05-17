import { Router } from "express";
import aiRouter from "./ai.routes";
import analyticsRouter from "./analytics.routes";

const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString()
    }
  });
});

apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/ai", aiRouter);

export default apiRouter;

