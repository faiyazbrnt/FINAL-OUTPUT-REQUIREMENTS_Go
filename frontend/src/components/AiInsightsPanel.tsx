import type { InsightResponse } from "../types";

type AiInsightsPanelProps = {
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
  data: InsightResponse | null;
};

const splitInsightSections = (insight: string): string[] => {
  const normalized = insight.trim();
  if (!normalized) {
    return [];
  }

  // Keep numbered sections (for example "1) Key trend") separated for a formal layout.
  const numberedSections = normalized
    .split(/(?=\d+\)\s+)/)
    .map((section) => section.trim())
    .filter(Boolean);

  if (numberedSections.length > 1) {
    return numberedSections;
  }

  const paragraphSections = normalized
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);

  return paragraphSections.length > 0 ? paragraphSections : [normalized];
};

const normalizeSectionContent = (section: string): string => section.replace(/^\d+\)\s+/, "").trim();
const countWords = (value: string): number => value.trim().split(/\s+/).filter(Boolean).length;

const AiInsightsPanel = ({ onGenerate, loading, error, data }: AiInsightsPanelProps): JSX.Element => {
  const insightSections = data ? splitInsightSections(data.insight) : [];
  const visibleInsightSections = insightSections.slice(0, 4);
  const normalizedSections = (
    visibleInsightSections.length > 0
      ? visibleInsightSections.map((section) => normalizeSectionContent(section))
      : data
        ? [data.insight.trim()]
        : []
  ).filter(Boolean);

  return (
    <section className="panel p-4 md:p-5" aria-label="AI insights panel">
      <div className="panel-header">
        <div>
          <h2 className="section-title">AI Insight</h2>
          <p className="section-subtitle">Generate concise observations from the latest dashboard outputs.</p>
        </div>
        <button className="ui-button ui-button-primary w-full sm:w-auto" type="button" onClick={onGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Insight"}
        </button>
      </div>

      {!loading && !error && !data && (
        <p className="status-panel border-dashed">
          Generate an AI summary from the latest KPI and chart data.
        </p>
      )}

      {error && <p className="status-panel status-panel-error">{error}</p>}

      {data && (
        <div className="ai-insight-container" role="region" aria-label="AI insight description">
          <header className="ai-insight-header">
            <h3 className="ai-insight-heading">Insight Description</h3>
            <p className="ai-insight-subheading">
              {normalizedSections.length} structured {normalizedSections.length === 1 ? "insight" : "insights"}
            </p>
          </header>

          <div className="ai-insight-body">
            <ol className="ai-insight-list">
              {normalizedSections.map((section, index) => (
                <li key={`${index}-${section.slice(0, 24)}`} className="ai-insight-item">
                  <article>
                    <div className="ai-insight-item-header">
                      <h4 className="ai-insight-item-title">Insight {String(index + 1).padStart(2, "0")}</h4>
                      <p className="ai-insight-item-meta">{countWords(section)} words</p>
                    </div>
                    <p className="ai-insight-item-content">{section}</p>
                  </article>
                </li>
              ))}
            </ol>
          </div>
          {data.fallbackUsed && (
            <p className="ai-insight-fallback">Fallback mode was used for this response.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default AiInsightsPanel;
