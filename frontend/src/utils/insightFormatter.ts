import type { InsightResponse } from "../types";

export const FALLBACK_RECOMMENDATION_MESSAGE = "No actionable recommendations available for this dataset.";

const MIN_RECOMMENDATION_LENGTH = 12;

const toSingleSpace = (value: string): string => value.replace(/\s+/g, " ").trim();

const normalizeTitleKey = (value: string): string => value.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

export const sanitizeInsightMarkdown = (rawValue: string): string => {
  return rawValue
    .replace(/\r/g, "")
    .replace(/```/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*\*\*\s*$/gm, "")
    .replace(/^\s*[-*]{1,3}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const cleanupInsightTitle = (rawTitle: string): string => {
  const title = sanitizeInsightMarkdown(rawTitle).replace(/^\s*\d+[\).\s-]+/, "").replace(/[:\-]+$/, "").trim();
  const normalized = normalizeTitleKey(title);

  if (normalized.includes("key trend")) {
    return "Key Trend";
  }
  if (normalized.includes("top driver")) {
    return "Top Driver";
  }
  if (normalized.includes("potential anomaly")) {
    return "Potential Anomaly";
  }
  if (normalized.includes("actionable recommendation")) {
    return "Actionable Recommendations";
  }

  return toSingleSpace(title);
};

export const validateRecommendations = (rawRecommendations: unknown): string[] => {
  if (!Array.isArray(rawRecommendations)) {
    return [];
  }

  const unique = new Map<string, string>();
  for (const entry of rawRecommendations) {
    if (typeof entry !== "string") {
      continue;
    }

    const cleaned = toSingleSpace(
      sanitizeInsightMarkdown(entry).replace(/^\s*(?:[-*]+|\d+[\).\s-]+|[A-Z][\).\s-]+)\s*/, "")
    );

    if (cleaned.length < MIN_RECOMMENDATION_LENGTH) {
      continue;
    }

    const key = cleaned.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, cleaned);
    }
  }

  return [...unique.values()].slice(0, 3);
};

const countWords = (value: string): number => value.split(/\s+/).filter(Boolean).length;

const parseNarrativeSections = (rawInsight: string): Array<{ title: string; description: string }> => {
  const normalized = sanitizeInsightMarkdown(rawInsight)
    .replace(/\b1[\)\.\-]?\s*key\s*trend\s*[:\-]?/gi, "\nKey Trend: ")
    .replace(/\b2[\)\.\-]?\s*top\s*driver\s*[:\-]?/gi, "\nTop Driver: ")
    .replace(/\b3[\)\.\-]?\s*potential\s*anomaly\s*[:\-]?/gi, "\nPotential Anomaly: ")
    .replace(/\b4[\)\.\-]?\s*(?:two\s*)?actionable\s*recommendations?\s*[:\-]?/gi, "\nActionable Recommendations: ");

  const headerRegex = /(^|\n)\s*(Key\s*Trend|Top\s*Driver|Potential\s*Anomaly|Actionable\s*Recommendations?)\s*[:\-]?\s*/gi;
  const headers: Array<{ title: string; contentStart: number; matchStart: number }> = [];
  let match = headerRegex.exec(normalized);

  while (match) {
    headers.push({
      title: cleanupInsightTitle(match[2]),
      contentStart: headerRegex.lastIndex,
      matchStart: match.index
    });
    match = headerRegex.exec(normalized);
  }

  const sections: Array<{ title: string; description: string }> = [];
  for (let i = 0; i < headers.length; i += 1) {
    const current = headers[i];
    const next = headers[i + 1];
    const block = normalized.slice(current.contentStart, next ? next.matchStart : normalized.length);
    const description = toSingleSpace(
      block
        .split("\n")
        .map((line) => line.replace(/^\s*(?:[-*]+|\d+[\).\s-]+|[A-Z][\).\s-]+)\s*/, "").trim())
        .filter(Boolean)
        .join(" ")
    );

    if (description) {
      sections.push({ title: current.title, description });
    }
  }

  return sections;
};

const parseNarrativeRecommendations = (rawInsight: string): string[] => {
  const sections = parseNarrativeSections(rawInsight);
  const recommendationSection = sections.find((section) => cleanupInsightTitle(section.title) === "Actionable Recommendations");
  if (!recommendationSection) {
    return [];
  }

  return validateRecommendations(
    recommendationSection.description
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
  );
};

export const getInsightCards = (data: InsightResponse | null): Array<{ title: string; description: string; wordCount: number }> => {
  if (!data) {
    return [];
  }

  const fromStructured = (data.structuredInsights ?? [])
    .map((item) => ({
      title: cleanupInsightTitle(item.title ?? ""),
      description: toSingleSpace(sanitizeInsightMarkdown(item.description ?? "")),
      wordCount: Number.isFinite(item.wordCount) && item.wordCount > 0 ? item.wordCount : countWords(item.description ?? "")
    }))
    .filter((item) => item.title !== "Actionable Recommendations" && item.description.length > 0);

  if (fromStructured.length > 0) {
    return fromStructured;
  }

  return parseNarrativeSections(data.insight)
    .filter((section) => cleanupInsightTitle(section.title) !== "Actionable Recommendations")
    .map((section) => ({
      title: cleanupInsightTitle(section.title),
      description: section.description,
      wordCount: countWords(section.description)
    }));
};

export const getRecommendations = (data: InsightResponse | null): string[] => {
  if (!data) {
    return [];
  }

  const validated = validateRecommendations(data.recommendations ?? []);
  if (validated.length > 0) {
    return validated;
  }

  return parseNarrativeRecommendations(data.insight);
};
