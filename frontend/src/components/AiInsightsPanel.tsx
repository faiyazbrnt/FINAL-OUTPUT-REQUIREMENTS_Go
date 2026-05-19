import type { ReactNode } from "react";
import type { InsightResponse } from "../types";
import {
  FALLBACK_RECOMMENDATION_MESSAGE,
  getInsightCards,
  getRecommendations,
  getStructuredReport,
  sanitizeInsightMarkdown
} from "../utils/insightFormatter";

type AiInsightsPanelProps = {
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  data: InsightResponse | null;
};

type InsightSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

const FALLBACK_SUMMARY_MESSAGE = "Summary unavailable for this response.";
const FALLBACK_INSIGHTS_MESSAGE = "No key findings available.";
const FALLBACK_REASONING_MESSAGE = "Reasoning details unavailable for this response.";

const normalizeLines = (value: string): string[] => {
  return sanitizeInsightMarkdown(value)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

const isBulletLine = (line: string): boolean => /^\s*(?:[-*]\s+|\d+[\).\s-]+)/.test(line);

const toBulletText = (line: string): string => line.replace(/^\s*(?:[-*]\s+|\d+[\).\s-]+)/, "").trim();

const InsightContent = ({ value, fallback }: { value: string; fallback: string }): JSX.Element => {
  const lines = normalizeLines(value);

  if (lines.length === 0) {
    return <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">{fallback}</p>;
  }

  const allBulletLines = lines.length > 1 && lines.every(isBulletLine);
  if (allBulletLines) {
    return (
      <ul className="space-y-2">
        {lines.map((line, index) => (
          <li key={`line-bullet-${index}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
            {toBulletText(line)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <p key={`line-${index}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700 break-words">
          {line}
        </p>
      ))}
    </div>
  );
};

const InsightList = ({ items, fallback }: { items: string[]; fallback: string }): JSX.Element => {
  if (items.length === 0) {
    return <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">{fallback}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`item-${index}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700 break-words">
          {sanitizeInsightMarkdown(item)}
        </li>
      ))}
    </ul>
  );
};

const InsightSection = ({ title, defaultOpen = false, children }: InsightSectionProps): JSX.Element => {
  return (
    <details open={defaultOpen} className="rounded-lg bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">{title}</summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  );
};

const AiInsightsPanel = ({ onGenerate, loading, error, data }: AiInsightsPanelProps): JSX.Element => {
  const insightCards = getInsightCards(data);
  const recommendations = getRecommendations(data);
  const structuredReport = getStructuredReport(data);
  const safeRecommendations = recommendations.length > 0 ? recommendations : [FALLBACK_RECOMMENDATION_MESSAGE];
  const fallbackInsights = insightCards
    .map((card) => {
      const title = sanitizeInsightMarkdown(card.title);
      const description = sanitizeInsightMarkdown(card.description);
      if (title && description) {
        return `${title}: ${description}`;
      }
      return description || title;
    })
    .filter(Boolean);
  const insightItems = structuredReport?.keyFindings && structuredReport.keyFindings.length > 0 ? structuredReport.keyFindings : fallbackInsights;
  const recommendationItems =
    structuredReport?.recommendations && structuredReport.recommendations.length > 0
      ? structuredReport.recommendations
      : safeRecommendations;
  const reasoningNotes = structuredReport?.confidenceNotes ?? "";
  const riskAreas = structuredReport?.riskAreas ?? [];

  return (
    <section className="panel p-4 md:p-5" aria-label="AI insights panel">
      <div className="panel-header">
        <h2 className="text-base font-semibold">AI Insight</h2>
        <button
          className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Insight"}
        </button>
      </div>

      {!loading && !error && !data && (
        <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          Generate an AI summary from the latest KPI and chart data.
        </p>
      )}

      {loading && (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Processing insight pipeline...</p>
          <p>1. Injecting dashboard context and filter-aware metrics.</p>
          <p>2. Running trend, anomaly, and recommendation analysis.</p>
          <p>3. Finalizing structured executive insight output.</p>
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 md:p-4">
            <InsightSection title="Summary" defaultOpen>
              <InsightContent value={structuredReport?.executiveSummary ?? ""} fallback={FALLBACK_SUMMARY_MESSAGE} />
            </InsightSection>

            <InsightSection title="Insights">
              <InsightList items={insightItems} fallback={FALLBACK_INSIGHTS_MESSAGE} />
            </InsightSection>

            <InsightSection title="Recommendations">
              <InsightList items={recommendationItems} fallback={FALLBACK_RECOMMENDATION_MESSAGE} />
            </InsightSection>

            <InsightSection title="Reasoning">
              <div className="space-y-2">
                {riskAreas.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Risk Areas</p>
                    <InsightList items={riskAreas} fallback={FALLBACK_REASONING_MESSAGE} />
                  </>
                )}
                <InsightContent value={reasoningNotes} fallback={FALLBACK_REASONING_MESSAGE} />
              </div>
            </InsightSection>
          </div>

          {data.fallbackUsed && (
            <p className="mt-3 text-xs font-semibold text-amber-700">Fallback mode was used for this response.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default AiInsightsPanel;
