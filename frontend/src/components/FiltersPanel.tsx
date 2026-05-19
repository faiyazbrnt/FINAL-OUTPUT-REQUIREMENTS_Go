import type { Dispatch, SetStateAction } from "react";
import type { DashboardFilters, ImportExportNotice } from "../types";
import ImportExportButton from "./ImportExportButton";

type FiltersPanelProps = {
  filters: DashboardFilters;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  onRefresh: () => void;
  onImportData: (file: File) => Promise<void>;
  onExportPdf: () => Promise<void>;
  onExportCsv: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  onDownloadCsvTemplate: () => Promise<void>;
  onDownloadExcelTemplate: () => Promise<void>;
  importExportDisabled: boolean;
  importExportStatus: ImportExportNotice | null;
  dataSourceLabel: string;
};

const FiltersPanel = ({
  filters,
  setFilters,
  onRefresh,
  onImportData,
  onExportPdf,
  onExportCsv,
  onExportExcel,
  onDownloadCsvTemplate,
  onDownloadExcelTemplate,
  importExportDisabled,
  importExportStatus,
  dataSourceLabel
}: FiltersPanelProps): JSX.Element => {
  const statusToneClass =
    importExportStatus?.tone === "error"
      ? "import-export-status-error"
      : importExportStatus?.tone === "success"
        ? "import-export-status-success"
        : "import-export-status-info";

  return (
    <section className="panel panel-filters p-4 md:p-5" aria-label="Dashboard filters">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Filters</h2>
          <p className="section-subtitle">Refine dashboard metrics and chart aggregation behavior.</p>
        </div>
        <button className="ui-button ui-button-secondary w-full sm:w-auto" onClick={onRefresh} type="button">
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="ui-label">
          Top Categories Limit
          <select
            className="ui-select"
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

        <label className="ui-label">
          Age Trend Bucket Size
          <select
            className="ui-select"
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

        <div className="ui-label">
          Data Actions
          <ImportExportButton
            disabled={importExportDisabled}
            onImportData={onImportData}
            onExportPdf={onExportPdf}
            onExportCsv={onExportCsv}
            onExportExcel={onExportExcel}
            onDownloadCsvTemplate={onDownloadCsvTemplate}
            onDownloadExcelTemplate={onDownloadExcelTemplate}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="import-export-source">Current dataset: {dataSourceLabel}</p>
        {importExportStatus && <p className={`import-export-status ${statusToneClass}`}>{importExportStatus.message}</p>}
      </div>
    </section>
  );
};

export default FiltersPanel;
