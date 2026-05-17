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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="panel p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{displayTitle}</h1>
              <p className="mt-1 text-sm text-slate-600">Titanic analytics with AI-generated observations</p>
            </div>
            <p className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Last updated: {lastUpdatedLabel}</p>
          </div>
        </header>

        <FiltersPanel filters={filters} setFilters={setFilters} onRefresh={refresh} />

        {loading && (
          <section className="panel p-4 text-sm text-slate-600">
            <p>Loading dashboard data...</p>
          </section>
        )}

        {error && (
          <section className="panel p-4 text-sm text-red-700">
            <p>{error}</p>
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
      </div>
    </main>
  );
};

export default DashboardPage;
