import type { Dispatch, SetStateAction } from "react";
import type { DashboardFilters } from "../types";

type FiltersPanelProps = {
  filters: DashboardFilters;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  onRefresh: () => void;
};

const FiltersPanel = ({ filters, setFilters, onRefresh }: FiltersPanelProps): JSX.Element => {
  return (
    <section className="panel p-4 md:p-5" aria-label="Dashboard filters">
      <div className="panel-header">
        <h2 className="text-base font-semibold">Filters</h2>
        <button
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          onClick={onRefresh}
          type="button"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Top Categories Limit
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            value={filters.categoryLimit}
            onChange={(event) => {
              const limit = Number(event.target.value);
              setFilters((current) => ({ ...current, categoryLimit: limit }));
            }}
          >
            <option value={3}>Top 3</option>
            <option value={5}>Top 5</option>
            <option value={8}>Top 8</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Age Trend Bucket Size
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            value={filters.ageBucketSize}
            onChange={(event) => {
              const bucketSize = Number(event.target.value);
              setFilters((current) => ({ ...current, ageBucketSize: bucketSize }));
            }}
          >
            <option value={5}>5 years</option>
            <option value={10}>10 years</option>
            <option value={15}>15 years</option>
            <option value={20}>20 years</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          AI Insight Max Words
          <input
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
            type="number"
            min={60}
            max={220}
            step={10}
            value={filters.maxInsightWords}
            onChange={(event) => {
              const maxInsightWords = Number(event.target.value);
              setFilters((current) => ({ ...current, maxInsightWords }));
            }}
          />
        </label>
      </div>
    </section>
  );
};

export default FiltersPanel;
