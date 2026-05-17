import type { InsightResponse } from "../types";
import {
  FALLBACK_RECOMMENDATION_MESSAGE,
  getInsightCards,
  getRecommendations,
  sanitizeInsightMarkdown
} from "../utils/insightFormatter";

type AiInsightsPanelProps = {
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  data: InsightResponse | null;
};

const AiInsightsPanel = ({ onGenerate, loading, error, data }: AiInsightsPanelProps): JSX.Element => {
  const insightCards = getInsightCards(data);
  const recommendations = getRecommendations(data);
  const safeRecommendations = recommendations.length > 0 ? recommendations : [FALLBACK_RECOMMENDATION_MESSAGE];
  const insightCountLabel = `${insightCards.length} structured insight${insightCards.length === 1 ? "" : "s"}`;

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

      {error && <p className="rounded-md bg-red-50 px-3 py-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Insight Description</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{insightCountLabel}</p>
          </div>

          <div className="space-y-3">
            {insightCards.map((card, index) => (
              <article
                key={`${card.title}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:p-5"
                aria-label={`Insight ${index + 1}`}
              >
                <div className="flex items-center justify-between gap-3 border-b border-dashed border-slate-300 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{`Insight ${String(
                    index + 1
                  ).padStart(2, "0")}`}</p>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {`${card.wordCount} words`}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold leading-6 text-slate-900 md:text-lg">{sanitizeInsightMarkdown(card.title)}</h3>
                <p className="mt-2 break-words text-sm font-medium leading-7 text-slate-700 md:text-[0.96rem]">{card.description}</p>
              </article>
            ))}
          </div>

          <article className="mt-3 rounded-xl border border-slate-200 bg-white p-4 md:p-5" aria-label="Actionable recommendations">
            <div className="border-b border-dashed border-slate-300 pb-2">
              <h3 className="text-base font-bold leading-6 text-slate-900 md:text-lg">Actionable Recommendations</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {safeRecommendations.map((recommendation, index) => (
                <li key={`recommendation-${index}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium leading-6 text-slate-700">
                  {recommendation}
                </li>
              ))}
            </ul>
          </article>

          {data.fallbackUsed && (
            <p className="mt-3 text-xs font-semibold text-amber-700">Fallback mode was used for this response.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default AiInsightsPanel;
