import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/httpError";

export const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      details: error.details
    });
    return;
  }

  console.error("Unhandled server error:", error);

  res.status(500).json({
    success: false,
    message: "An unexpected error occurred.",
    errorCode: "INTERNAL_SERVER_ERROR",
    details: env.NODE_ENV === "development" ? String(error) : undefined
  });
};

