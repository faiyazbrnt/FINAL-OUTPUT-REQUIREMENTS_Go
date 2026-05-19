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
  structuredInsights?: Array<{
    title: string;
    description: string;
    wordCount: number;
  }>;
  recommendations?: string[];
  report?: {
    executiveSummary?: string;
    keyFindings?: string[];
    riskAreas?: string[];
    recommendations?: string[];
    confidenceNotes?: string;
  };
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
};

export type ImportedPassengerRow = {
  survived: 0 | 1;
  pclass: number;
  sex: "male" | "female";
  age: number | null;
  fare: number;
  embarked: "C" | "Q" | "S" | null;
};

export type ImportExportNotice = {
  tone: "success" | "error" | "info";
  message: string;
};
