import AiInsightsPanel from "../components/AiInsightsPanel";
import DataTable from "../components/DataTable";
import FiltersPanel from "../components/FiltersPanel";
import KpiCards from "../components/KpiCards";
import AgeTrendLineChart from "../charts/AgeTrendLineChart";
import CategoryBarChart from "../charts/CategoryBarChart";
import RegionalPieChart from "../charts/RegionalPieChart";
import { useDashboardData } from "../hooks/useDashboardData";

const appTitle = import.meta.env.VITE_APP_TITLE || "DataInsights Analytics Dashboard";
const displayTitle = appTitle.replace(/\s*\(local dev\)\s*$/i, "");

const DashboardPage = (): JSX.Element => {
  const { filters, setFilters, summary, loading, error, insightState, requestInsight, refresh, lastUpdatedLabel } =
    useDashboardData();

  return (
    <main className="dashboard-shell">
      <div className="dashboard-content mx-auto flex w-full max-w-[86rem] flex-col gap-5">
        <header className="panel page-header p-5 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-3xl flex-col gap-2">
              <span className="hero-kicker">Operations Dashboard</span>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{displayTitle}</h1>
              <p className="section-subtitle">Titanic analytics with AI-generated observations</p>
            </div>
            <p className="ui-status-tag">Last updated: {lastUpdatedLabel}</p>
          </div>
        </header>

        <FiltersPanel filters={filters} setFilters={setFilters} onRefresh={refresh} />

        {loading && (
          <section className="panel p-4 md:p-5">
            <div className="status-panel">
              <p>Loading dashboard data...</p>
            </div>
          </section>
        )}

        {error && (
          <section className="panel p-4 md:p-5">
            <div className="status-panel status-panel-error">
              <p>{error}</p>
            </div>
          </section>
        )}

        {!loading && !error && (
          <div className="dashboard-grid">
            <KpiCards kpis={summary.kpis} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CategoryBarChart data={summary.topCategories} />
              <RegionalPieChart data={summary.regionalDistribution} />
            </div>

            <AgeTrendLineChart data={summary.ageTrend} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AiInsightsPanel
                loading={insightState.loading}
                error={insightState.error}
                data={insightState.data}
                onGenerate={requestInsight}
              />
              <DataTable rows={summary.topCategories} />
            </div>
          </div>
        )}

        <footer className="app-footer px-1 pb-2 pt-1 text-center">
          Data refreshed from backend analytics and AI services with existing validations and workflows.
        </footer>
      </div>
    </main>
  );
};

export default DashboardPage;
