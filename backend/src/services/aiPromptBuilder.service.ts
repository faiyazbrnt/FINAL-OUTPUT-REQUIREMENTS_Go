type PromptRole = "system" | "user" | "assistant";

export type PromptMessage = {
  role: PromptRole;
  content: string;
};

type SummaryShape = {
  kpis?: {
    totalPassengers?: number;
    survivors?: number;
    survivalRatePct?: number;
    averageAge?: number;
    averageFare?: number;
    topSurvivalClass?: string;
  };
  topCategories?: Array<{
    category?: string;
    passengerCount?: number;
    survivalRatePct?: number;
    avgFare?: number;
  }>;
  regionalDistribution?: Array<{
    region?: string;
    passengerCount?: number;
    sharePct?: number;
    survivalRatePct?: number;
  }>;
  ageTrend?: Array<{
    ageBand?: string;
    passengerCount?: number;
    survivalRatePct?: number;
  }>;
};

const MAX_PAYLOAD_CHARACTERS = 7_500;
const MAX_LIST_ITEMS = 4;

const sanitizePromptValue = (value: string): string => {
  return value.replace(/\r/g, "").replace(/\u0000/g, "").trim();
};

const numberOrZero = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const trimContext = (summary: unknown): SummaryShape => {
  const data = (summary ?? {}) as SummaryShape;
  return {
    kpis: data.kpis ?? {},
    topCategories: (data.topCategories ?? []).slice(0, MAX_LIST_ITEMS),
    regionalDistribution: (data.regionalDistribution ?? []).slice(0, MAX_LIST_ITEMS),
    ageTrend: (data.ageTrend ?? []).slice(0, MAX_LIST_ITEMS)
  };
};

const buildHistoricalComparison = (summary: SummaryShape): string[] => {
  const comparisons: string[] = [];
  const topCategory = (summary.topCategories ?? [])[0];
  const secondCategory = (summary.topCategories ?? [])[1];
  const topRegion = (summary.regionalDistribution ?? [])[0];
  const secondRegion = (summary.regionalDistribution ?? [])[1];
  const topAge = [...(summary.ageTrend ?? [])].sort(
    (a, b) => numberOrZero(b.survivalRatePct) - numberOrZero(a.survivalRatePct)
  )[0];

  if (topCategory && secondCategory) {
    comparisons.push(
      `${topCategory.category ?? "Unknown"} survives ${(numberOrZero(topCategory.survivalRatePct) - numberOrZero(secondCategory.survivalRatePct)).toFixed(2)} percentage points differently than ${secondCategory.category ?? "Unknown"}.`
    );
  }

  if (topRegion && secondRegion) {
    comparisons.push(
      `${topRegion.region ?? "Unknown"} share is ${(numberOrZero(topRegion.sharePct) - numberOrZero(secondRegion.sharePct)).toFixed(2)} percentage points above ${secondRegion.region ?? "Unknown"}.`
    );
  }

  if (topAge) {
    comparisons.push(
      `Highest age-band survival appears in ${topAge.ageBand ?? "Unknown"} at ${numberOrZero(topAge.survivalRatePct).toFixed(2)}%.`
    );
  }

  return comparisons;
};

const buildContextPayload = (summary: unknown): string => {
  const trimmed = trimContext(summary);
  const comparisons = buildHistoricalComparison(trimmed);
  const contextPayload = {
    selectedFilters: "Use current dashboard filters tied to this summary payload.",
    dashboardMetrics: trimmed.kpis,
    aggregatedStatistics: {
      topCategories: trimmed.topCategories,
      regionalDistribution: trimmed.regionalDistribution,
      ageTrend: trimmed.ageTrend
    },
    historicalComparisons: comparisons
  };

  const serialized = sanitizePromptValue(JSON.stringify(contextPayload));
  if (serialized.length <= MAX_PAYLOAD_CHARACTERS) {
    return serialized;
  }

  return serialized.slice(0, MAX_PAYLOAD_CHARACTERS);
};

export const buildInsightPromptConversation = (
  summary: unknown,
  maxWords: number
): { messages: PromptMessage[]; debugPrompt: string } => {
  const safeWordTarget = Math.max(60, Math.min(maxWords, 220));
  const contextPayload = buildContextPayload(summary);

  const systemPrompt = sanitizePromptValue(`
You are an Operations Intelligence Analyst combining skills from business analysis, financial insights, and data intelligence.
Instruction hierarchy:
1) Follow the required output schema exactly.
2) Base conclusions only on provided context.
3) Keep reasoning concise and do not reveal hidden internal reasoning traces.
4) If data is missing, state assumptions briefly and lower confidence.
`);

  const contextInjectionPrompt = sanitizePromptValue(`
Step 1 - Context Injection:
Review the dashboard context payload.
${contextPayload}
Return a short acknowledgement with 3 bullets:
- Most important KPI to watch
- Most likely risk signal
- One data quality caveat
`);

  const refinementPrompt = sanitizePromptValue(`
Step 2 - Analytical Reasoning:
Using the same context, perform staged analysis:
1) Identify major trends and directional movement.
2) Detect spikes/anomalies and potential causes.
3) Compare category/region/age cohorts where useful.
4) Recommend concrete next actions with expected operational impact.
5) Produce a compact confidence rationale.

Step 3 - Final Structured Output:
Return valid JSON only, no markdown:
{
  "executiveSummary": "string",
  "keyFindings": ["string", "string", "string"],
  "riskAreas": ["string", "string"],
  "recommendations": ["string", "string", "string"],
  "confidenceNotes": "string"
}
Rules:
- Keep total response under ${safeWordTarget} words.
- Recommendations must be actionable and data-linked.
- Use short, high-signal language.
`);

  const messages: PromptMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: contextInjectionPrompt },
    {
      role: "assistant",
      content:
        "Acknowledged. I will prioritize KPI signal detection, anomaly validation, and actionable operational recommendations."
    },
    { role: "user", content: refinementPrompt }
  ];

  return {
    messages,
    debugPrompt: messages.map((message) => `[${message.role.toUpperCase()}]\n${message.content}`).join("\n\n")
  };
};
