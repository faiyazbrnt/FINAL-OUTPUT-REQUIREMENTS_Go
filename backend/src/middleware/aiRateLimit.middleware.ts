import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/httpError";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestLog = new Map<string, number[]>();

export const aiRateLimit = (req: Request, _res: Response, next: NextFunction): void => {
  const now = Date.now();
  const key = req.ip || "unknown";
  const recent = (requestLog.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    next(new AppError("AI route rate limit exceeded. Please retry in a minute.", 429, "RATE_LIMIT_EXCEEDED"));
    return;
  }

  recent.push(now);
  requestLog.set(key, recent);
  next();
};

