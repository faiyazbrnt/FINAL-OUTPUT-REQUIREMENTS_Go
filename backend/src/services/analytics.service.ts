import { type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { env } from "../config/env";
import { isSupabaseConfigured, supabase, supabaseDiagnostics } from "../config/supabase";
import { AppError } from "../utils/httpError";

type TitanicPassenger = {
  survived: number;
  pclass: number;
  sex: "male" | "female";
  age: number | null;
  fare: number;
  embarked: "C" | "Q" | "S" | null;
};

const LOCAL_DATASET_PATH_CANDIDATES = [
  "../dataset/cleaned/titanic_train_cleaned_db.csv",
  "dataset/cleaned/titanic_train_cleaned_db.csv"
];

let localPassengersPromise: Promise<TitanicPassenger[]> | null = null;

const round = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const percent = (part: number, whole: number): number => {
  if (whole === 0) {
    return 0;
  }

  return round((part / whole) * 100, 2);
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseOptionalNumber = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const loadLocalPassengersFromCsv = async (): Promise<TitanicPassenger[]> => {
  let fileContents: string | null = null;
  let resolvedPath = "";

  for (const candidate of LOCAL_DATASET_PATH_CANDIDATES) {
    const absolutePath = resolve(process.cwd(), candidate);
    try {
      fileContents = await readFile(absolutePath, "utf-8");
      resolvedPath = absolutePath;
      break;
    } catch {
      // Try next candidate path.
    }
  }

  if (!fileContents) {
    throw new AppError(
      "Local analytics dataset was not found.",
      500,
      "LOCAL_DATASET_NOT_FOUND",
      "Expected dataset/cleaned/titanic_train_cleaned_db.csv."
    );
  }

  const lines = fileContents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const survivedIndex = headers.indexOf("survived");
  const pclassIndex = headers.indexOf("pclass");
  const sexIndex = headers.indexOf("sex");
  const ageIndex = headers.indexOf("age");
  const fareIndex = headers.indexOf("fare");
  const embarkedIndex = headers.indexOf("embarked");

  if ([survivedIndex, pclassIndex, sexIndex, ageIndex, fareIndex, embarkedIndex].some((index) => index === -1)) {
    throw new AppError(
      "Local analytics dataset schema is invalid.",
      500,
      "LOCAL_DATASET_INVALID_SCHEMA",
      `Required columns are missing in ${resolvedPath}.`
    );
  }

  const rows: TitanicPassenger[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const survivedRaw = parseOptionalNumber(values[survivedIndex]);
    const pclassRaw = parseOptionalNumber(values[pclassIndex]);
    const fareRaw = parseOptionalNumber(values[fareIndex]);
    const ageRaw = parseOptionalNumber(values[ageIndex]);
    const sexRaw = (values[sexIndex] || "").trim().toLowerCase();
    const embarkedRaw = (values[embarkedIndex] || "").trim().toUpperCase();

    if (survivedRaw === null || pclassRaw === null || fareRaw === null || (sexRaw !== "male" && sexRaw !== "female")) {
      continue;
    }

    rows.push({
      survived: survivedRaw === 1 ? 1 : 0,
      pclass: pclassRaw,
      sex: sexRaw,
      age: ageRaw,
      fare: fareRaw,
      embarked: embarkedRaw === "C" || embarkedRaw === "Q" || embarkedRaw === "S" ? embarkedRaw : null
    });
  }

  return rows;
};

const getLocalPassengers = async (): Promise<TitanicPassenger[]> => {
  if (!localPassengersPromise) {
    localPassengersPromise = loadLocalPassengersFromCsv();
  }

  return localPassengersPromise;
};

const getSupabaseClient = (): SupabaseClient => {
  if (!isSupabaseConfigured || !supabase) {
    if (!supabaseDiagnostics.supabaseUrlExists) {
      console.error("[analytics] Supabase URL is missing.");
      throw new AppError(
        "Supabase credentials are missing. Update backend/.env with valid Supabase values.",
        500,
        "SUPABASE_MISSING_URL"
      );
    }

    if (!supabaseDiagnostics.supabaseUrlFormatValid) {
      console.error("[analytics] Supabase URL format is invalid.");
      throw new AppError(
        "Supabase credentials are missing. Update backend/.env with valid Supabase values.",
        500,
        "SUPABASE_INVALID_URL"
      );
    }

    if (!supabaseDiagnostics.supabaseKeyExists) {
      console.error("[analytics] Supabase key is missing.");
      throw new AppError(
        "Supabase credentials are missing. Update backend/.env with valid Supabase values.",
        500,
        "SUPABASE_MISSING_KEY"
      );
    }

    console.error("[analytics] Supabase client is unavailable due to configuration state.");
    throw new AppError(
      "Supabase credentials are missing. Update backend/.env with valid Supabase values.",
      500,
      "SUPABASE_NOT_CONFIGURED"
    );
  }

  return supabase;
};

const getErrorDetails = (error: unknown): string => {
  if (!error) {
    return "Unknown error";
  }

  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause && typeof cause === "object") {
      const code = (cause as { code?: string }).code;
      const message = (cause as { message?: string }).message;
      if (code || message) {
        return `${error.message}${code ? ` | cause.code=${code}` : ""}${message ? ` | cause.message=${message}` : ""}`;
      }
    }

    return error.message;
  }

  return String(error);
};

const getErrorCode = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const directCode = (error as Error & { code?: string }).code;
  if (directCode) {
    return directCode;
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause && typeof cause === "object") {
    return (cause as { code?: string }).code;
  }

  return undefined;
};

const classifyFetchFailure = (error: unknown): { errorCode: string; logReason: string } => {
  const details = getErrorDetails(error).toLowerCase();
  const code = getErrorCode(error)?.toUpperCase();

  if (code === "ERR_INVALID_URL" || details.includes("invalid url")) {
    return {
      errorCode: "SUPABASE_INVALID_URL",
      logReason: "Supabase URL is invalid. Check SUPABASE_URL format."
    };
  }

  if (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    details.includes("fetch failed")
  ) {
    return {
      errorCode: "SUPABASE_NETWORK_ERROR",
      logReason: "Network request to Supabase failed."
    };
  }

  return {
    errorCode: "SUPABASE_QUERY_ERROR",
    logReason: "Unexpected Supabase request error."
  };
};

const fetchPassengers = async (): Promise<TitanicPassenger[]> => {
  if (!isSupabaseConfigured || !supabase) {
    if (env.NODE_ENV !== "production") {
      console.warn("[analytics] Supabase is not configured. Falling back to local CSV dataset.");
      return getLocalPassengers();
    }
  }

  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from("titanic_passengers")
      .select("survived,pclass,sex,age,fare,embarked")
      .order("passenger_id", { ascending: true });

    if (error) {
      const normalizedMessage = error.message.toLowerCase();
      if (
        normalizedMessage.includes("invalid api key") ||
        normalizedMessage.includes("jwt") ||
        normalizedMessage.includes("permission denied")
      ) {
        console.error("[analytics] Supabase authentication/authorization failure.", {
          message: error.message,
          hint: error.hint ?? null,
          code: error.code ?? null
        });
        throw new AppError(
          "Failed to fetch analytics data from Supabase.",
          500,
          "SUPABASE_AUTH_ERROR",
          "Supabase credentials are invalid or missing permissions."
        );
      }

      console.error("[analytics] Supabase query returned an error.", {
        message: error.message,
        hint: error.hint ?? null,
        code: error.code ?? null,
        details: error.details ?? null
      });
      throw new AppError(
        "Failed to fetch analytics data from Supabase.",
        500,
        "SUPABASE_QUERY_ERROR",
        "Supabase query failed. Check server logs for details."
      );
    }

    return (data || []) as TitanicPassenger[];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const classified = classifyFetchFailure(error);
    console.error(`[analytics] ${classified.logReason}`, {
      errorDetails: getErrorDetails(error),
      errorCode: getErrorCode(error) ?? null
    });

    throw new AppError(
      "Failed to fetch analytics data from Supabase.",
      500,
      classified.errorCode,
      "Supabase request failed. Check server logs for details."
    );
  }
};

export const getKpiMetrics = async (): Promise<{
  totalPassengers: number;
  survivors: number;
  survivalRatePct: number;
  averageAge: number;
  averageFare: number;
  topSurvivalClass: string;
}> => {
  const rows = await fetchPassengers();

  if (rows.length === 0) {
    return {
      totalPassengers: 0,
      survivors: 0,
      survivalRatePct: 0,
      averageAge: 0,
      averageFare: 0,
      topSurvivalClass: "N/A"
    };
  }

  const totalPassengers = rows.length;
  const survivors = rows.filter((row) => row.survived === 1).length;
  const fares = rows.map((row) => Number(row.fare) || 0);
  const ages = rows.map((row) => row.age).filter((age): age is number => age !== null);

  const classStats = new Map<number, { total: number; survived: number }>();
  for (const row of rows) {
    const current = classStats.get(row.pclass) || { total: 0, survived: 0 };
    current.total += 1;
    if (row.survived === 1) {
      current.survived += 1;
    }
    classStats.set(row.pclass, current);
  }

  const topClass = [...classStats.entries()]
    .map(([pclass, stats]) => ({
      pclass,
      rate: percent(stats.survived, stats.total)
    }))
    .sort((a, b) => b.rate - a.rate)[0];

  return {
    totalPassengers,
    survivors,
    survivalRatePct: percent(survivors, totalPassengers),
    averageAge: round(ages.reduce((sum, age) => sum + age, 0) / Math.max(ages.length, 1), 2),
    averageFare: round(fares.reduce((sum, fare) => sum + fare, 0) / Math.max(fares.length, 1), 2),
    topSurvivalClass: topClass ? `Class ${topClass.pclass}` : "N/A"
  };
};

export const getTopCategoriesAnalytics = async (
  limit = 5
): Promise<Array<{ category: string; passengerCount: number; survivalRatePct: number; avgFare: number }>> => {
  const rows = await fetchPassengers();
  const grouped = new Map<number, { passengerCount: number; survived: number; fareSum: number }>();

  for (const row of rows) {
    const current = grouped.get(row.pclass) || { passengerCount: 0, survived: 0, fareSum: 0 };
    current.passengerCount += 1;
    current.fareSum += Number(row.fare) || 0;
    if (row.survived === 1) {
      current.survived += 1;
    }
    grouped.set(row.pclass, current);
  }

  return [...grouped.entries()]
    .map(([pclass, stats]) => ({
      category: `Class ${pclass}`,
      passengerCount: stats.passengerCount,
      survivalRatePct: percent(stats.survived, stats.passengerCount),
      avgFare: round(stats.fareSum / Math.max(stats.passengerCount, 1), 2)
    }))
    .sort((a, b) => b.passengerCount - a.passengerCount)
    .slice(0, limit);
};

const embarkedLabel: Record<string, string> = {
  C: "Cherbourg",
  Q: "Queenstown",
  S: "Southampton",
  Unknown: "Unknown"
};

export const getRegionalDistributionAnalytics = async (): Promise<
  Array<{ region: string; passengerCount: number; sharePct: number; survivalRatePct: number }>
> => {
  const rows = await fetchPassengers();
  const grouped = new Map<string, { passengerCount: number; survived: number }>();

  for (const row of rows) {
    const regionCode = row.embarked || "Unknown";
    const current = grouped.get(regionCode) || { passengerCount: 0, survived: 0 };
    current.passengerCount += 1;
    if (row.survived === 1) {
      current.survived += 1;
    }
    grouped.set(regionCode, current);
  }

  return [...grouped.entries()]
    .map(([regionCode, stats]) => ({
      region: `${regionCode} - ${embarkedLabel[regionCode] || "Unknown"}`,
      passengerCount: stats.passengerCount,
      sharePct: percent(stats.passengerCount, rows.length),
      survivalRatePct: percent(stats.survived, stats.passengerCount)
    }))
    .sort((a, b) => b.passengerCount - a.passengerCount);
};

export const getTrendAnalytics = async (
  bucketSize = 10
): Promise<Array<{ ageBand: string; passengerCount: number; survivalRatePct: number }>> => {
  const rows = await fetchPassengers();
  const rowsWithAge = rows.filter((row) => row.age !== null);

  if (rowsWithAge.length === 0) {
    return [];
  }

  const grouped = new Map<number, { passengerCount: number; survived: number }>();

  for (const row of rowsWithAge) {
    const age = row.age as number;
    const bucketStart = Math.floor(age / bucketSize) * bucketSize;
    const current = grouped.get(bucketStart) || { passengerCount: 0, survived: 0 };
    current.passengerCount += 1;
    if (row.survived === 1) {
      current.survived += 1;
    }
    grouped.set(bucketStart, current);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, stats]) => ({
      ageBand: `${bucketStart}-${bucketStart + bucketSize - 1}`,
      passengerCount: stats.passengerCount,
      survivalRatePct: percent(stats.survived, stats.passengerCount)
    }));
};

export const getAnalyticsSummary = async (): Promise<{
  kpis: Awaited<ReturnType<typeof getKpiMetrics>>;
  topCategories: Awaited<ReturnType<typeof getTopCategoriesAnalytics>>;
  regionalDistribution: Awaited<ReturnType<typeof getRegionalDistributionAnalytics>>;
  ageTrend: Awaited<ReturnType<typeof getTrendAnalytics>>;
}> => {
  const [kpis, topCategories, regionalDistribution, ageTrend] = await Promise.all([
    getKpiMetrics(),
    getTopCategoriesAnalytics(3),
    getRegionalDistributionAnalytics(),
    getTrendAnalytics(10)
  ]);

  return {
    kpis,
    topCategories,
    regionalDistribution,
    ageTrend
  };
};
