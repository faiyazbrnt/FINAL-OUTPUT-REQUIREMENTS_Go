import type { DashboardSummary, ImportedPassengerRow } from "../types";

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

const embarkedLabel: Record<string, string> = {
  C: "Cherbourg",
  Q: "Queenstown",
  S: "Southampton",
  Unknown: "Unknown"
};

export const buildDashboardSummaryFromPassengers = (
  rows: ImportedPassengerRow[],
  categoryLimit: number,
  ageBucketSize: number
): DashboardSummary => {
  if (rows.length === 0) {
    return {
      kpis: {
        totalPassengers: 0,
        survivors: 0,
        survivalRatePct: 0,
        averageAge: 0,
        averageFare: 0,
        topSurvivalClass: "N/A"
      },
      topCategories: [],
      regionalDistribution: [],
      ageTrend: []
    };
  }

  const totalPassengers = rows.length;
  const survivors = rows.filter((row) => row.survived === 1).length;
  const fares = rows.map((row) => row.fare);
  const ages = rows.map((row) => row.age).filter((age): age is number => age !== null);

  const classStats = new Map<number, { total: number; survived: number; fareSum: number }>();
  for (const row of rows) {
    const current = classStats.get(row.pclass) || { total: 0, survived: 0, fareSum: 0 };
    current.total += 1;
    current.fareSum += row.fare;
    if (row.survived === 1) {
      current.survived += 1;
    }
    classStats.set(row.pclass, current);
  }

  const topClass = [...classStats.entries()]
    .map(([pclass, stats]) => ({ pclass, rate: percent(stats.survived, stats.total) }))
    .sort((a, b) => b.rate - a.rate)[0];

  const topCategories = [...classStats.entries()]
    .map(([pclass, stats]) => ({
      category: `Class ${pclass}`,
      passengerCount: stats.total,
      survivalRatePct: percent(stats.survived, stats.total),
      avgFare: round(stats.fareSum / Math.max(stats.total, 1), 2)
    }))
    .sort((a, b) => b.passengerCount - a.passengerCount)
    .slice(0, categoryLimit);

  const regionStats = new Map<string, { total: number; survived: number }>();
  for (const row of rows) {
    const regionCode = row.embarked || "Unknown";
    const current = regionStats.get(regionCode) || { total: 0, survived: 0 };
    current.total += 1;
    if (row.survived === 1) {
      current.survived += 1;
    }
    regionStats.set(regionCode, current);
  }

  const regionalDistribution = [...regionStats.entries()]
    .map(([regionCode, stats]) => ({
      region: `${regionCode} - ${embarkedLabel[regionCode] || "Unknown"}`,
      passengerCount: stats.total,
      sharePct: percent(stats.total, totalPassengers),
      survivalRatePct: percent(stats.survived, stats.total)
    }))
    .sort((a, b) => b.passengerCount - a.passengerCount);

  const ageStats = new Map<number, { total: number; survived: number }>();
  for (const row of rows) {
    if (row.age === null) {
      continue;
    }
    const bucketStart = Math.floor(row.age / ageBucketSize) * ageBucketSize;
    const current = ageStats.get(bucketStart) || { total: 0, survived: 0 };
    current.total += 1;
    if (row.survived === 1) {
      current.survived += 1;
    }
    ageStats.set(bucketStart, current);
  }

  const ageTrend = [...ageStats.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, stats]) => ({
      ageBand: `${bucketStart}-${bucketStart + ageBucketSize - 1}`,
      passengerCount: stats.total,
      survivalRatePct: percent(stats.survived, stats.total)
    }));

  return {
    kpis: {
      totalPassengers,
      survivors,
      survivalRatePct: percent(survivors, totalPassengers),
      averageAge: round(ages.reduce((sum, age) => sum + age, 0) / Math.max(ages.length, 1), 2),
      averageFare: round(fares.reduce((sum, fare) => sum + fare, 0) / Math.max(fares.length, 1), 2),
      topSurvivalClass: topClass ? `Class ${topClass.pclass}` : "N/A"
    },
    topCategories,
    regionalDistribution,
    ageTrend
  };
};
