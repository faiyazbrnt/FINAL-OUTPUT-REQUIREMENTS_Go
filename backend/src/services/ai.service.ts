import axios, { type AxiosError } from "axios";
import { env } from "../config/env";
import { AppError } from "../utils/httpError";

type AiProvider = "gemini" | "groq";

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

const trimToWordLimit = (text: string, maxWords: number): string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
};

const normalizeSpacing = (text: string): string => text.replace(/\s+/g, " ").trim();

const enforceFirstFourInsights = (insight: string, maxWords: number): string => {
  const normalized = insight.trim();
  if (!normalized) {
    return normalized;
  }

  const numberedSections = normalized
    .split(/(?=\d+[\)\.]\s+)/)
    .map((section) => section.trim())
    .filter((section) => /^\d+[\)\.]\s+/.test(section));

  if (numberedSections.length === 0) {
    return trimToWordLimit(normalizeSpacing(normalized), maxWords);
  }

  const seenNumbers = new Set<number>();
  const firstFour = numberedSections
    .map((section) => {
      const match = section.match(/^(\d+)[\)\.]\s+/);
      if (!match) {
        return null;
      }

      const sectionNumber = Number(match[1]);
      if (!Number.isFinite(sectionNumber) || sectionNumber < 1 || sectionNumber > 4 || seenNumbers.has(sectionNumber)) {
        return null;
      }

      seenNumbers.add(sectionNumber);
      return `${sectionNumber}) ${section.slice(match[0].length).trim()}`;
    })
    .filter((section): section is string => Boolean(section));

  if (firstFour.length === 0) {
    return trimToWordLimit(normalizeSpacing(normalized), maxWords);
  }

  return trimToWordLimit(firstFour.join(" "), maxWords);
};

const buildLocalInsight = (summary: unknown, maxWords: number): string => {
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

  const insight = [
    `1) Key trend: The survival rate is ${survivalRate}% (${survivorCount}/${passengerCount}), with the strongest results in ${topClass}.`,
    `2) Top driver: ${topCategoryName} has the largest volume (${topCategoryCount} passengers) and a survival rate of ${topCategoryRate}%, indicating that class-level segmentation is the primary driver of outcomes.`,
    `3) Potential anomaly: ${topRegionName} accounts for ${topRegionShare}% of passengers but has a survival rate of ${topRegionRate}%. This regional skew should be reviewed for possible route or manifest bias. The highest age-band survival is in ${ageBandName} at ${ageBandRate}%.`,
    `4) Two actionable recommendations: A) Prioritize class- and embarkation-based risk and retention dashboards for earlier interventions. B) Add feature checks for interactions between fare (${avgFare}) and age (${avgAge}) to confirm whether these variables confound class effects.`
  ].join(" ");

  return trimToWordLimit(insight, maxWords);
};

const generateWithGemini = async (prompt: string): Promise<string> => {
  if (isMissingOrPlaceholder(env.GEMINI_API_KEY, ["your_gemini_api_key", "YOUR_GEMINI_API_KEY"])) {
    throw new AppError("Gemini API key is missing. Set GEMINI_API_KEY in .env.local", 500, "AI_NOT_CONFIGURED");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;
  const response = await axios.post(
    url,
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      timeout: 15_000
    }
  );

  const text = extractGeminiText(response.data);
  if (!text) {
    throw new AppError("Gemini returned an empty response.", 502, "AI_EMPTY_RESPONSE");
  }

  return text;
};

const generateWithGroq = async (prompt: string): Promise<string> => {
  if (isMissingOrPlaceholder(env.GROQ_API_KEY, ["your_groq_api_key", "YOUR_GROQ_API_KEY"])) {
    throw new AppError("Groq API key is missing. Set GROQ_API_KEY in .env.local", 500, "AI_NOT_CONFIGURED");
  }

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: env.GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`
      },
      timeout: 15_000
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

const runWithRetry = async (provider: AiProvider, prompt: string): Promise<string> => {
  const generate = provider === "groq" ? generateWithGroq : generateWithGemini;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await generate(prompt);
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
  return [
    "You are a business analyst for DataInsights Corp.",
    "Analyze this Titanic passenger analytics summary:",
    JSON.stringify(summary, null, 2),
    "Return exactly four numbered sections and do not include sections 5 or higher:",
    "1) Key trend",
    "2) Top driver",
    "3) Potential anomaly",
    "4) Two actionable recommendations",
    "Use clear, grammatically correct, professional English.",
    `Keep the answer concise and under ${maxWords} words.`
  ].join("\n");
};

export const generateAiInsight = async (summary: unknown, maxWords: number): Promise<{ insight: string; fallbackUsed: boolean }> => {
  const prompt = buildInsightPrompt(summary, maxWords);
  const providerOrder = getProviderOrder();
  const errors: string[] = [];

  if (!hasAnyProviderKey()) {
    return {
      insight: buildLocalInsight(summary, maxWords),
      fallbackUsed: true
    };
  }

  try {
    for (const provider of providerOrder) {
      try {
        const rawInsight = await runWithRetry(provider, prompt);
        const insight = enforceFirstFourInsights(rawInsight, maxWords);
        return { insight, fallbackUsed: false };
      } catch (error) {
        errors.push(formatProviderError(provider, error));
      }
    }

    throw new AppError(`All AI providers failed. ${errors.join(" | ")}`, 500, "AI_ERROR");
  } catch (error) {
    console.warn("AI generation failed; returning local insight fallback.");
    return {
      insight: buildLocalInsight(summary, maxWords),
      fallbackUsed: true
    };
  }
};

