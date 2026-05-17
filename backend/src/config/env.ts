import { config } from "dotenv";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  // Support running from either repo root or backend directory in local dev.
  config({ path: ".env" });
  config({ path: "../.env" });
  config({ path: "backend/.env" });

  // Local overrides win in development only.
  config({ path: ".env.local", override: true });
  config({ path: "../.env.local", override: true });
  config({ path: "backend/.env.local", override: true });
}

const trimString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
};

const compactToken = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\s+/g, "").trim();
};

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URL: z.preprocess(trimString, z.string()).default("http://localhost:5173"),
  SUPABASE_URL: z.preprocess(trimString, z.string()).default(""),
  SUPABASE_ANON_KEY: z.preprocess(compactToken, z.string()).default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(compactToken, z.string()).default(""),
  AI_PROVIDER: z.enum(["gemini", "groq"]).default("gemini"),
  GEMINI_API_KEY: z.preprocess(compactToken, z.string()).default(""),
  GEMINI_MODEL: z.preprocess(trimString, z.string()).default("gemini-2.0-flash"),
  GROQ_API_KEY: z.preprocess(compactToken, z.string()).default(""),
  GROQ_MODEL: z.preprocess(trimString, z.string()).default("llama3-8b-8192")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment configuration:\n${details.join("\n")}`);
}

export const env = parsed.data;


