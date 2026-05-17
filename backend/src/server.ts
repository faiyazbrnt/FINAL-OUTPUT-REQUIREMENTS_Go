import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { supabaseDiagnostics } from "./config/supabase";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/notFound.middleware";
import apiRouter from "./routes";
import { AppError } from "./utils/httpError";

const app = express();

const allowedOrigins = env.FRONTEND_URL.split(",")
  .map((origin) => origin.trim().toLowerCase())
  .filter(Boolean);

const normalizeOrigin = (origin: string): string => {
  try {
    const parsed = new URL(origin);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return origin.toLowerCase();
  }
};

const wildcardToRegex = (pattern: string): RegExp => {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexPattern = `^${escaped.replace(/\\\*/g, ".*")}$`;
  return new RegExp(regexPattern);
};

const isOriginAllowed = (origin: string): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);

  for (const allowedOrigin of allowedOrigins) {
    if (allowedOrigin.includes("*")) {
      const matcher = wildcardToRegex(allowedOrigin);
      if (matcher.test(normalizedOrigin)) {
        return true;
      }
      continue;
    }

    if (normalizedOrigin === normalizeOrigin(allowedOrigin)) {
      return true;
    }
  }

  return false;
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError("CORS blocked for this origin.", 403, "CORS_FORBIDDEN"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API is running"
  });
});

app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`[startup] Node version: ${process.version}`);
  console.log(`[startup] Global fetch available: ${typeof globalThis.fetch === "function" ? "YES" : "NO"}`);
  console.log(`[startup] Supabase URL exists: ${supabaseDiagnostics.supabaseUrlExists ? "YES" : "NO"}`);
  console.log(`[startup] Supabase URL format valid: ${supabaseDiagnostics.supabaseUrlFormatValid ? "YES" : "NO"}`);
  console.log(`[startup] Supabase Key exists: ${supabaseDiagnostics.supabaseKeyExists ? "YES" : "NO"}`);
  if (supabaseDiagnostics.reconstructedFromProjectId) {
    console.log("[startup] Supabase URL reconstructed from project ID.");
  }
  console.log(`Backend running on http://localhost:${env.PORT}`);
});
