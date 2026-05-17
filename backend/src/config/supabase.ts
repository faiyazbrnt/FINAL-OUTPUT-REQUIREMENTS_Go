import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const PLACEHOLDER_VALUES = new Set([
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_URL_OR_PROJECT_ID",
  "YOUR_SUPABASE_ANON_KEY",
  "YOUR_SUPABASE_SERVICE_ROLE_KEY",
  "your_supabase_url",
  "your_supabase_url_or_project_id",
  "your_supabase_anon_key",
  "your_supabase_service_role_key",
  "YOUR_SUPABASE_PROJECT_ID",
  "your_supabase_project_id"
]);

const isPlaceholder = (value: string): boolean => PLACEHOLDER_VALUES.has(value);
const isLikelyProjectId = (value: string): boolean => /^[a-z0-9]{20}$/i.test(value);

const normalizeSupabaseUrl = (
  rawValue: string
): { url: string; urlExists: boolean; urlFormatValid: boolean; reconstructedFromProjectId: boolean } => {
  const trimmed = rawValue.trim();

  if (!trimmed || isPlaceholder(trimmed)) {
    return {
      url: "",
      urlExists: false,
      urlFormatValid: false,
      reconstructedFromProjectId: false
    };
  }

  if (isLikelyProjectId(trimmed)) {
    return {
      url: `https://${trimmed}.supabase.co`,
      urlExists: true,
      urlFormatValid: true,
      reconstructedFromProjectId: true
    };
  }

  try {
    const normalized = new URL(trimmed);
    return {
      url: `${normalized.protocol}//${normalized.host}`,
      urlExists: true,
      urlFormatValid: normalized.protocol === "https:" || normalized.protocol === "http:",
      reconstructedFromProjectId: false
    };
  } catch {
    return {
      url: trimmed,
      urlExists: true,
      urlFormatValid: false,
      reconstructedFromProjectId: false
    };
  }
};

const supabaseUrlConfig = normalizeSupabaseUrl(env.SUPABASE_URL);

const rawServiceKey = (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY).trim();
const hasUsableKey = rawServiceKey !== "" && !isPlaceholder(rawServiceKey);

const hasUsableUrl = supabaseUrlConfig.urlExists && supabaseUrlConfig.urlFormatValid;

export const isSupabaseConfigured = hasUsableUrl && hasUsableKey;
export const resolvedSupabaseUrl = supabaseUrlConfig.url;

export const supabaseDiagnostics = {
  supabaseUrlExists: supabaseUrlConfig.urlExists,
  supabaseUrlFormatValid: supabaseUrlConfig.urlFormatValid,
  supabaseKeyExists: hasUsableKey,
  reconstructedFromProjectId: supabaseUrlConfig.reconstructedFromProjectId
};

export const supabase = isSupabaseConfigured
  ? createClient(resolvedSupabaseUrl, rawServiceKey)
  : null;

