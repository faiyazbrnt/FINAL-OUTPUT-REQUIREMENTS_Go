import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const PLACEHOLDER_VALUES = new Set([
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY",
  "YOUR_SUPABASE_SERVICE_ROLE_KEY",
  "your_supabase_url",
  "your_supabase_anon_key",
  "your_supabase_service_role_key"
]);

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

const hasUsableUrl = env.SUPABASE_URL !== "" && !PLACEHOLDER_VALUES.has(env.SUPABASE_URL);
const hasUsableKey = serviceKey !== "" && !PLACEHOLDER_VALUES.has(serviceKey);

export const isSupabaseConfigured = hasUsableUrl && hasUsableKey;

export const supabase = isSupabaseConfigured
  ? createClient(env.SUPABASE_URL, serviceKey)
  : null;

