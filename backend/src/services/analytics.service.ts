import { type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../config/supabase";
import { AppError } from "../utils/httpError";

type TitanicPassenger = {
  survived: number;
  pclass: number;
  sex: "male" | "female";
  age: number | null;
  fare: number;
  embarked: "C" | "Q" | "S" | null;
};

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

const getSupabaseClient = (): SupabaseClient => {
  if (!isSupabaseConfigured || !supabase) {
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

const fetchPassengers = async (): Promise<TitanicPassenger[]> => {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from("titanic_passengers")
      .select("survived,pclass,sex,age,fare,embarked")
      .order("passenger_id", { ascending: true });

    if (error) {
      throw new AppError("Failed to fetch analytics data from Supabase.", 500, "SUPABASE_QUERY_ERROR", error.message);
    }

    return (data || []) as TitanicPassenger[];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to fetch analytics data from Supabase.", 500, "SUPABASE_QUERY_ERROR", getErrorDetails(error));
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
