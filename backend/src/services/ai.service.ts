import axios, { type AxiosError } from "axios";
import { env } from "../config/env";
import { buildInsightPromptConversation, type PromptMessage } from "./aiPromptBuilder.service";
import { AppError } from "../utils/httpError";

type AiProvider = "gemini" | "groq";

type InsightTitle = "Key Trend" | "Top Driver" | "Potential Anomaly";

type StructuredInsight = {
  title: InsightTitle;
  description: string;
  wordCount: number;
};

type InsightReport = {
  executiveSummary: string;
  keyFindings: string[];
  riskAreas: string[];
  recommendations: string[];
  confidenceNotes: string;
};

type NormalizedInsightPayload = {
  insight: string;
  structuredInsights: StructuredInsight[];
  recommendations: string[];
  report: InsightReport;
};

const insightTitleOrder: InsightTitle[] = ["Key Trend", "Top Driver", "Potential Anomaly"];

const fallbackRecommendationMessage = "No actionable recommendations available for this dataset.";
const MIN_FINDING_LENGTH = 14;
const AI_RESPONSE_TIMEOUT_MS = 20_000;

const isMissingOrPlaceholder = (value: string, placeholders: string[]): boolean => {
  if (!value) {
    return true;
  }

  return placeholders.includes(value);
};

const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const shouldRetry = (error: unknown): boolean => {
  const axiosError = error as AxiosError | undefined;
  const status = axiosError?.response?.status;
  return status === 429 || (status !== undefined && status >= 500);
};

const formatProviderError = (provider: AiProvider, error: unknown): string => {
  if (error instanceof AppError) {
    return `${provider}: ${error.errorCode} (${error.message})`;
  }

  const axiosError = error as AxiosError | undefined;
  const status = axiosError?.response?.status;
  const statusText = axiosError?.response?.statusText;
  const message = axiosError?.message ?? "Unknown AI provider error";
  return `${provider}: HTTP ${status ?? "N/A"} ${statusText ?? ""}`.trim() + ` (${message})`;
};

const extractGeminiText = (payload: unknown): string | null => {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" && text.trim() ? text.trim() : null;
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

const numberOrZero = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const normalizeWhitespace = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};

const sanitizeMarkdownArtifacts = (rawText: string): string => {
  return rawText
    .replace(/\r/g, "")
    .replace(/```/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\*\s*$/gm, "")
    .replace(/^\s*[-*]{1,3}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const sanitizeDescription = (rawText: string): string => {
  return sanitizeMarkdownArtifacts(rawText)
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*]+|\d+[\).\s-]+|[A-Z][\).\s-]+)\s*/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const normalizeInsightTitle = (rawTitle: string): InsightTitle | null => {
  const simplified = rawTitle.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

  if (simplified.includes("key trend")) {
    return "Key Trend";
  }

  if (simplified.includes("top driver")) {
    return "Top Driver";
  }

  if (simplified.includes("potential anomaly")) {
    return "Potential Anomaly";
  }

  return null;
};

const normalizeForParsing = (rawText: string): string => {
  return sanitizeMarkdownArtifacts(rawText)
    .replace(/\b1[\)\.\-]?\s*key\s*trend\s*[:\-]?/gi, "\nKey Trend: ")
    .replace(/\b2[\)\.\-]?\s*top\s*driver\s*[:\-]?/gi, "\nTop Driver: ")
    .replace(/\b3[\)\.\-]?\s*potential\s*anomaly\s*[:\-]?/gi, "\nPotential Anomaly: ")
    .replace(/\b4[\)\.\-]?\s*(?:two\s*)?actionable\s*recommendations?\s*[:\-]?/gi, "\nActionable Recommendations: ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const withWordCount = (title: InsightTitle, description: string): StructuredInsight => {
  const cleanDescription = sanitizeDescription(description);
  return {
    title,
    description: cleanDescription,
    wordCount: countWords(cleanDescription)
  };
};

const extractRecommendations = (rawBlock: string): string[] => {
  const cleaned = sanitizeMarkdownArtifacts(rawBlock);

  const lineCandidates = cleaned
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*]+|\d+[\).\s-]+|[A-Z][\).\s-]+)\s*/, "").trim())
    .filter((line) => line.length > 12 && !/actionable recommendations?/i.test(line));

  const sentenceCandidates = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/^\s*(?:[-*]+|\d+[\).\s-]+|[A-Z][\).\s-]+)\s*/, "").trim())
    .filter((sentence) => sentence.length > 12 && !/actionable recommendations?/i.test(sentence));

  const unique = new Map<string, string>();
  for (const candidate of [...lineCandidates, ...sentenceCandidates]) {
    const normalized = normalizeWhitespace(candidate).toLowerCase();
    if (!normalized || unique.has(normalized)) {
      continue;
    }

    unique.set(normalized, normalizeWhitespace(candidate));
  }

  return [...unique.values()].slice(0, 3);
};

const cleanList = (values: unknown, maxItems: number): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  const unique = new Map<string, string>();
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const cleaned = sanitizeDescription(value);
    if (cleaned.length < MIN_FINDING_LENGTH) {
      continue;
    }

    const key = normalizeWhitespace(cleaned).toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, normalizeWhitespace(cleaned));
    }
  }

  return [...unique.values()].slice(0, maxItems);
};

const parseJsonFromAiText = (rawText: string): Partial<InsightReport> | null => {
  const cleaned = sanitizeMarkdownArtifacts(rawText).replace(/^json\s*/i, "");
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return null;
  }

  const candidate = cleaned.slice(jsonStart, jsonEnd + 1);
  try {
    return JSON.parse(candidate) as Partial<InsightReport>;
  } catch {
    return null;
  }
};

const extractStructuredFromText = (rawText: string): { structuredInsights: StructuredInsight[]; recommendations: string[] } => {
  const normalizedText = normalizeForParsing(rawText);

  const headerRegex = /(^|\n)\s*(Key\s*Trend|Top\s*Driver|Potential\s*Anomaly|Actionable\s*Recommendations?)\s*[:\-]?\s*/gi;
  const headers: Array<{ title: string; contentStart: number; matchStart: number }> = [];

  let match = headerRegex.exec(normalizedText);
  while (match) {
    headers.push({
      title: match[2],
      contentStart: headerRegex.lastIndex,
      matchStart: match.index
    });
    match = headerRegex.exec(normalizedText);
  }

  const structuredInsights: StructuredInsight[] = [];
  let recommendations: string[] = [];

  if (headers.length === 0) {
    return { structuredInsights, recommendations };
  }

  for (let index = 0; index < headers.length; index += 1) {
    const current = headers[index];
    const next = headers[index + 1];
    const block = normalizedText.slice(current.contentStart, next ? next.matchStart : normalizedText.length).trim();

    if (/actionable recommendations?/i.test(current.title)) {
      recommendations = extractRecommendations(block);
      continue;
    }

    const normalizedTitle = normalizeInsightTitle(current.title);
    const description = sanitizeDescription(block);

    if (!normalizedTitle || !description) {
      continue;
    }

    structuredInsights.push(withWordCount(normalizedTitle, description));
  }

  return { structuredInsights, recommendations };
};

const composeInsightText = (structuredInsights: StructuredInsight[], recommendations: string[]): string => {
  const insightLines = structuredInsights.map((entry) => `${entry.title}: ${entry.description}`);
  const recommendationLines =
    recommendations.length > 0 ? recommendations.map((item) => `- ${item}`) : [fallbackRecommendationMessage];

  return [...insightLines, "Actionable Recommendations:", ...recommendationLines].join("\n");
};

const generateFallbackRecommendations = (summary: unknown): string[] => {
  const data = (summary ?? {}) as SummaryShape;
  const kpis = data.kpis ?? {};
  const topCategory = (data.topCategories ?? [])[0] ?? {};
  const topRegion = (data.regionalDistribution ?? [])[0] ?? {};
  const strongestAgeBand = [...(data.ageTrend ?? [])]
    .sort((a, b) => numberOrZero(b.survivalRatePct) - numberOrZero(a.survivalRatePct))[0] ?? {};

  const recommendations: string[] = [];

  if (topCategory.category) {
    recommendations.push(
      `Prioritize class-specific intervention tracking for ${topCategory.category}, since it has the largest passenger volume and outsized impact on overall outcomes.`
    );
  }

  if (topRegion.region) {
    recommendations.push(
      `Run a focused quality check on embarkation data for ${topRegion.region} to confirm whether regional survival variance reflects signal or sampling bias.`
    );
  }

  if (strongestAgeBand.ageBand) {
    recommendations.push(
      `Create an age-band monitoring rule for ${strongestAgeBand.ageBand} to replicate factors behind stronger survival performance in adjacent cohorts.`
    );
  }

  if (recommendations.length === 0 && Number.isFinite(numberOrZero(kpis.survivalRatePct))) {
    recommendations.push(
      `Track weekly survival-rate movement against the current ${numberOrZero(kpis.survivalRatePct).toFixed(2)}% baseline and trigger review when drift exceeds 2 percentage points.`
    );
  }

  return recommendations.slice(0, 3);
};

const trimToWordLimit = (text: string, maxWords: number): string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
};

const buildLocalInsightPayload = (summary: unknown, maxWords: number): NormalizedInsightPayload => {
  const data = (summary ?? {}) as SummaryShape;
  const kpis = data.kpis ?? {};
  const topCategory = (data.topCategories ?? [])[0] ?? {};
  const topRegion = (data.regionalDistribution ?? [])[0] ?? {};
  const strongestAgeBand = [...(data.ageTrend ?? [])]
    .sort((a, b) => numberOrZero(b.survivalRatePct) - numberOrZero(a.survivalRatePct))[0] ?? {};

  const survivalRate = numberOrZero(kpis.survivalRatePct).toFixed(2);
  const survivorCount = Math.round(numberOrZero(kpis.survivors));
  const passengerCount = Math.round(numberOrZero(kpis.totalPassengers));
  const avgFare = numberOrZero(kpis.averageFare).toFixed(2);
  const avgAge = numberOrZero(kpis.averageAge).toFixed(2);
  const topClass = kpis.topSurvivalClass || "N/A";

  const topCategoryName = topCategory.category || "N/A";
  const topCategoryCount = Math.round(numberOrZero(topCategory.passengerCount));
  const topCategoryRate = numberOrZero(topCategory.survivalRatePct).toFixed(2);

  const topRegionName = topRegion.region || "N/A";
  const topRegionShare = numberOrZero(topRegion.sharePct).toFixed(2);
  const topRegionRate = numberOrZero(topRegion.survivalRatePct).toFixed(2);

  const ageBandName = strongestAgeBand.ageBand || "N/A";
  const ageBandRate = numberOrZero(strongestAgeBand.survivalRatePct).toFixed(2);

  const structuredInsights: StructuredInsight[] = [
    withWordCount(
      "Key Trend",
      `Overall survival is ${survivalRate}% (${survivorCount}/${passengerCount}), with Class ${topClass} performing best across passenger segments.`
    ),
    withWordCount(
      "Top Driver",
      `${topCategoryName} holds the largest passenger share (${topCategoryCount}) and a ${topCategoryRate}% survival rate, indicating class-level factors are the strongest outcome driver.`
    ),
    withWordCount(
      "Potential Anomaly",
      `${topRegionName} contributes ${topRegionShare}% of passengers but shows ${topRegionRate}% survival, and ${ageBandName} peaks at ${ageBandRate}% survival, so both should be validated for sample skew.`
    )
  ];

  const fallbackRecommendations = generateFallbackRecommendations(summary);
  const recommendationAugmentation =
    fallbackRecommendations.length > 0
      ? fallbackRecommendations
      : [
          `Review interactions between fare (${avgFare}) and age (${avgAge}) against class outcome differences to confirm whether confounding variables are inflating the trend.`
        ];

  const report: InsightReport = {
    executiveSummary: `Survival is ${survivalRate}% with class-level outcomes led by ${topClass}, while regional and age-band variation suggests targeted operational review opportunities.`,
    keyFindings: structuredInsights.map((item) => item.description).slice(0, 3),
    riskAreas: [
      `${topRegionName} shows ${topRegionRate}% survival against ${topRegionShare}% passenger share; verify sample balance and embarkation data quality.`,
      `${ageBandName} leads at ${ageBandRate}% survival, which may indicate cohort concentration effects rather than broad trend stability.`
    ],
    recommendations: recommendationAugmentation.slice(0, 3),
    confidenceNotes:
      "Confidence is moderate because conclusions rely on aggregated slices without row-level causality testing; recommendations should be validated with deeper segmentation."
  };

  return {
    insight: trimToWordLimit(composeInsightText(structuredInsights, recommendationAugmentation), maxWords),
    structuredInsights,
    recommendations: recommendationAugmentation.slice(0, 3),
    report
  };
};

const buildReportFromExistingSections = (
  structuredInsights: StructuredInsight[],
  recommendations: string[],
  fallbackReport: InsightReport
): InsightReport => {
  const keyFindings = cleanList(
    [
      ...structuredInsights.map((item) => item.description),
      fallbackReport.keyFindings[0],
      fallbackReport.keyFindings[1],
      fallbackReport.keyFindings[2]
    ],
    4
  );

  const riskAreas = cleanList(
    [structuredInsights[2]?.description, fallbackReport.riskAreas[0], fallbackReport.riskAreas[1]],
    3
  );

  const finalRecommendations = cleanList(recommendations, 3);
  return {
    executiveSummary: structuredInsights[0]?.description || fallbackReport.executiveSummary,
    keyFindings: keyFindings.length > 0 ? keyFindings : fallbackReport.keyFindings,
    riskAreas: riskAreas.length > 0 ? riskAreas : fallbackReport.riskAreas,
    recommendations: finalRecommendations.length > 0 ? finalRecommendations : fallbackReport.recommendations,
    confidenceNotes: fallbackReport.confidenceNotes
  };
};

const buildStructuredInsightsFromReport = (report: InsightReport, fallback: StructuredInsight[]): StructuredInsight[] => {
  const keyTrend = report.keyFindings[0] || report.executiveSummary || fallback[0]?.description || "";
  const topDriver = report.keyFindings[1] || fallback[1]?.description || keyTrend;
  const anomaly = report.riskAreas[0] || report.keyFindings[2] || fallback[2]?.description || keyTrend;

  return [
    withWordCount("Key Trend", keyTrend),
    withWordCount("Top Driver", topDriver),
    withWordCount("Potential Anomaly", anomaly)
  ];
};

const normalizeStructuredReport = (
  rawReport: Partial<InsightReport> | null,
  fallbackPayload: NormalizedInsightPayload
): InsightReport => {
  if (!rawReport) {
    return fallbackPayload.report;
  }

  const executiveSummary = sanitizeDescription(rawReport.executiveSummary ?? "");
  const keyFindings = cleanList(rawReport.keyFindings ?? [], 4);
  const riskAreas = cleanList(rawReport.riskAreas ?? [], 3);
  const recommendations = cleanList(rawReport.recommendations ?? [], 3);
  const confidenceNotes = sanitizeDescription(rawReport.confidenceNotes ?? "");

  if (!executiveSummary || keyFindings.length === 0) {
    return fallbackPayload.report;
  }

  return {
    executiveSummary,
    keyFindings,
    riskAreas: riskAreas.length > 0 ? riskAreas : fallbackPayload.report.riskAreas,
    recommendations: recommendations.length > 0 ? recommendations : fallbackPayload.report.recommendations,
    confidenceNotes: confidenceNotes || fallbackPayload.report.confidenceNotes
  };
};

const normalizeAiInsightPayload = (rawInsight: string, summary: unknown, maxWords: number): NormalizedInsightPayload => {
  const { structuredInsights: extractedInsights, recommendations: extractedRecommendations } = extractStructuredFromText(rawInsight);
  const localFallback = buildLocalInsightPayload(summary, maxWords);
  const parsedReport = parseJsonFromAiText(rawInsight);
  const normalizedReport = normalizeStructuredReport(parsedReport, localFallback);

  // Keep deterministic title order and backfill missing sections so the UI never renders sparse cards.
  const insightByTitle = new Map<InsightTitle, StructuredInsight>();
  for (const insight of extractedInsights) {
    if (insight.description) {
      insightByTitle.set(insight.title, withWordCount(insight.title, insight.description));
    }
  }

  for (const fallbackInsight of localFallback.structuredInsights) {
    if (!insightByTitle.has(fallbackInsight.title)) {
      insightByTitle.set(fallbackInsight.title, fallbackInsight);
    }
  }

  for (const reportInsight of buildStructuredInsightsFromReport(normalizedReport, localFallback.structuredInsights)) {
    if (!insightByTitle.has(reportInsight.title)) {
      insightByTitle.set(reportInsight.title, reportInsight);
    }
  }

  const structuredInsights = insightTitleOrder
    .map((title) => insightByTitle.get(title))
    .filter((entry): entry is StructuredInsight => Boolean(entry));

  const fallbackRecommendations = generateFallbackRecommendations(summary);
  const recommendations =
    extractedRecommendations.length > 0
      ? extractedRecommendations.slice(0, 3)
      : fallbackRecommendations.length > 0
      ? fallbackRecommendations
      : localFallback.recommendations;

  const report = buildReportFromExistingSections(structuredInsights, recommendations, normalizedReport);

  return {
    insight: trimToWordLimit(composeInsightText(structuredInsights, recommendations), maxWords),
    structuredInsights,
    recommendations,
    report
  };
};

const logPromptDebug = (provider: AiProvider, debugPrompt: string): void => {
  if (env.NODE_ENV === "production") {
    return;
  }

  console.debug(`[AI Prompt][${provider}] ${debugPrompt}`);
};

const generateWithGemini = async (messages: PromptMessage[]): Promise<string> => {
  if (isMissingOrPlaceholder(env.GEMINI_API_KEY, ["your_gemini_api_key", "YOUR_GEMINI_API_KEY"])) {
    throw new AppError("Gemini API key is missing. Set GEMINI_API_KEY in .env.local", 500, "AI_NOT_CONFIGURED");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;
  const [system, ...conversation] = messages;
  const contents = conversation.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }]
  }));

  const response = await axios.post(
    url,
    {
      systemInstruction: { parts: [{ text: system?.content ?? "" }] },
      contents
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      timeout: AI_RESPONSE_TIMEOUT_MS
    }
  );

  const text = extractGeminiText(response.data);
  if (!text) {
    throw new AppError("Gemini returned an empty response.", 502, "AI_EMPTY_RESPONSE");
  }

  return text;
};

const generateWithGroq = async (messages: PromptMessage[]): Promise<string> => {
  if (isMissingOrPlaceholder(env.GROQ_API_KEY, ["your_groq_api_key", "YOUR_GROQ_API_KEY"])) {
    throw new AppError("Groq API key is missing. Set GROQ_API_KEY in .env.local", 500, "AI_NOT_CONFIGURED");
  }

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: env.GROQ_MODEL,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
      temperature: 0.2
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`
      },
      timeout: AI_RESPONSE_TIMEOUT_MS
    }
  );

  const text = response.data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new AppError("Groq returned an empty response.", 502, "AI_EMPTY_RESPONSE");
  }

  return text.trim();
};

const providerHasUsableKey = (provider: AiProvider): boolean => {
  if (provider === "gemini") {
    return !isMissingOrPlaceholder(env.GEMINI_API_KEY, ["your_gemini_api_key", "YOUR_GEMINI_API_KEY"]);
  }

  return !isMissingOrPlaceholder(env.GROQ_API_KEY, ["your_groq_api_key", "YOUR_GROQ_API_KEY"]);
};

const getProviderOrder = (): AiProvider[] => {
  const preferred = env.AI_PROVIDER;
  const secondary: AiProvider = preferred === "groq" ? "gemini" : "groq";

  const order = [preferred, secondary].filter((provider) => providerHasUsableKey(provider));
  return order.length > 0 ? order : [preferred, secondary];
};

const hasAnyProviderKey = (): boolean => {
  return providerHasUsableKey("gemini") || providerHasUsableKey("groq");
};

const runWithRetry = async (provider: AiProvider, messages: PromptMessage[]): Promise<string> => {
  const generate = provider === "groq" ? generateWithGroq : generateWithGemini;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await generate(messages);
    } catch (error) {
      if (attempt === 0 && shouldRetry(error)) {
        await delay(700);
        continue;
      }

      throw error;
    }
  }

  throw new AppError("AI service failed unexpectedly.", 500, "AI_ERROR");
};

export const buildInsightPrompt = (summary: unknown, maxWords: number): string => {
  return buildInsightPromptConversation(summary, maxWords).debugPrompt;
};

export const generateAiInsight = async (
  summary: unknown,
  maxWords: number
): Promise<{
  insight: string;
  fallbackUsed: boolean;
  structuredInsights: StructuredInsight[];
  recommendations: string[];
  report: InsightReport;
}> => {
  const promptConversation = buildInsightPromptConversation(summary, maxWords);
  const providerOrder = getProviderOrder();
  const errors: string[] = [];

  if (!hasAnyProviderKey()) {
    const localPayload = buildLocalInsightPayload(summary, maxWords);
    return {
      insight: localPayload.insight,
      fallbackUsed: true,
      structuredInsights: localPayload.structuredInsights,
      recommendations: localPayload.recommendations,
      report: localPayload.report
    };
  }

  try {
    for (const provider of providerOrder) {
      try {
        logPromptDebug(provider, promptConversation.debugPrompt);
        const insight = await runWithRetry(provider, promptConversation.messages);
        const normalizedPayload = normalizeAiInsightPayload(insight, summary, maxWords);
        return {
          insight: normalizedPayload.insight,
          fallbackUsed: false,
          structuredInsights: normalizedPayload.structuredInsights,
          recommendations: normalizedPayload.recommendations,
          report: normalizedPayload.report
        };
      } catch (error) {
        errors.push(formatProviderError(provider, error));
      }
    }

    throw new AppError(`All AI providers failed. ${errors.join(" | ")}`, 500, "AI_ERROR");
  } catch (error) {
    console.warn("AI generation failed; returning local insight fallback.");
    const localPayload = buildLocalInsightPayload(summary, maxWords);
    return {
      insight: localPayload.insight,
      fallbackUsed: true,
      structuredInsights: localPayload.structuredInsights,
      recommendations: localPayload.recommendations,
      report: localPayload.report
    };
  }
};



