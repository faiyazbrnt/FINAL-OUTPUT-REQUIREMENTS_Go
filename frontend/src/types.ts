export type Kpis = {
  totalPassengers: number;
  survivors: number;
  survivalRatePct: number;
  averageAge: number;
  averageFare: number;
  topSurvivalClass: string;
};

export type TopCategory = {
  category: string;
  passengerCount: number;
  survivalRatePct: number;
  avgFare: number;
};

export type RegionDistribution = {
  region: string;
  passengerCount: number;
  sharePct: number;
  survivalRatePct: number;
};

export type AgeTrend = {
  ageBand: string;
  passengerCount: number;
  survivalRatePct: number;
};

export type InsightResponse = {
  insight: string;
  fallbackUsed: boolean;
};

export type DashboardSummary = {
  kpis: Kpis;
  topCategories: TopCategory[];
  regionalDistribution: RegionDistribution[];
  ageTrend: AgeTrend[];
};

export type DashboardFilters = {
  categoryLimit: number;
  ageBucketSize: number;
  maxInsightWords: number;
};
