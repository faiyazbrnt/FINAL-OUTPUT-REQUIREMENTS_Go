import type { InsightResponse } from "../types";

type AiInsightsPanelProps = {
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  data: InsightResponse | null;
};

const AiInsightsPanel = ({ onGenerate, loading, error, data }: AiInsightsPanelProps): JSX.Element => {
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
        <div className="space-y-2 rounded-md border border-slate-200 bg-white px-3 py-3">
          <p className="text-sm leading-6 text-slate-700">{data.insight}</p>
          {data.fallbackUsed && (
            <p className="text-xs font-medium text-amber-700">Fallback mode was used for this response.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default AiInsightsPanel;
