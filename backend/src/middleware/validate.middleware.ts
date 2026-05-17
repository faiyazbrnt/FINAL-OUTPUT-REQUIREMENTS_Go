import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/httpError";

type Source = "body" | "query" | "params";

export const validate =
  <T>(schema: ZodSchema<T>, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(
        new AppError("Request validation failed", 400, "VALIDATION_ERROR", {
          source,
          issues: result.error.issues
        })
      );
      return;
    }

    if (source === "body") {
      req.body = result.data;
      next();
      return;
    }

    const target = req[source] as Record<string, unknown>;
    for (const key of Object.keys(target)) {
      delete target[key];
    }
    Object.assign(target, result.data as Record<string, unknown>);

    next();
  };

