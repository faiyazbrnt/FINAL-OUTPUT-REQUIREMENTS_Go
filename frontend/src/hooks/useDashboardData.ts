import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSummary, generateInsight } from "../services/api";
import type {
  DashboardFilters,
  DashboardSummary,
  ImportedPassengerRow,
  ImportExportNotice,
  InsightResponse
} from "../types";
import { buildDashboardSummaryFromPassengers } from "../utils/passengerAnalytics";
import { getImportErrorMessage, importPassengerDataset } from "../services/importService";
import {
  exportDashboardAsCsv,
  exportDashboardAsExcel,
  exportDashboardAsPdf
} from "../services/exportService";
import { downloadCsvTemplate, downloadExcelTemplate } from "../utils/templateGenerator";

const defaultSummary: DashboardSummary = {
  kpis: {
    totalPassengers: 0,
    survivors: 0,
    survivalRatePct: 0,
    averageAge: 0,
    averageFare: 0,
    topSurvivalClass: "N/A"
  },
  topCategories: [],
  regionalDistribution: [],
  ageTrend: []
};

const defaultFilters: DashboardFilters = {
  categoryLimit: 5,
  ageBucketSize: 10
};

export const useDashboardData = () => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importExportStatus, setImportExportStatus] = useState<ImportExportNotice | null>(null);
  const [importExportBusy, setImportExportBusy] = useState(false);
  const [importedRows, setImportedRows] = useState<ImportedPassengerRow[] | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);

  const [insightState, setInsightState] = useState<{
    loading: boolean;
    error: string | null;
    data: InsightResponse | null;
  }>({
    loading: false,
    error: null,
    data: null
  });

  const dataSourceLabel = importedRows && importedFileName ? `Imported file: ${importedFileName}` : "Backend analytics dataset";

  const loadDashboard = useCallback(async () => {
    if (importedRows) {
      setLoading(true);
      setError(null);
      try {
        const nextSummary = buildDashboardSummaryFromPassengers(
          importedRows,
          filters.categoryLimit,
          filters.ageBucketSize
        );
        setSummary(nextSummary);
      } catch (err) {
        setError("Unable to compute analytics from the imported dataset.");
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextSummary = await fetchSummary(filters.categoryLimit, filters.ageBucketSize);
      setSummary(nextSummary);
    } catch (err) {
      setError("Unable to load analytics data. Please check backend connectivity.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters.ageBucketSize, filters.categoryLimit, importedRows]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const requestInsight = useCallback(async () => {
    try {
      setInsightState({ loading: true, error: null, data: null });
      const data = await generateInsight({
        summary,
        maxWords: 150
      });
      setInsightState({ loading: false, error: null, data });
    } catch (err) {
      setInsightState({
        loading: false,
        error: "Insight request failed. Please try again in a moment.",
        data: null
      });
      console.error(err);
    }
  }, [summary]);

  const runImportExportTask = useCallback(
    async (task: () => Promise<void>) => {
      setImportExportBusy(true);
      setImportExportStatus(null);
      try {
        await task();
      } finally {
        setImportExportBusy(false);
      }
    },
    [setImportExportBusy, setImportExportStatus]
  );

  const onImportData = useCallback(
    async (file: File) => {
      await runImportExportTask(async () => {
        try {
          const imported = await importPassengerDataset(file);
          setImportedRows(imported.rows);
          setImportedFileName(imported.fileName);
          const warningDetails =
            imported.warnings.length > 0 ? ` ${imported.warnings.join(" ")}` : "";
          setImportExportStatus({
            tone: "success",
            message: `Imported ${imported.rows.length} valid row(s) from ${imported.fileName}.${warningDetails}`
          });
        } catch (error) {
          setImportExportStatus({
            tone: "error",
            message: getImportErrorMessage(error)
          });
        }
      });
    },
    [runImportExportTask]
  );

  const buildExportPayload = useCallback(() => {
    return {
      summary,
      filters,
      sourceLabel: dataSourceLabel,
      importedRows
    };
  }, [dataSourceLabel, filters, importedRows, summary]);

  const onExportPdf = useCallback(async () => {
    await runImportExportTask(async () => {
      try {
        exportDashboardAsPdf(buildExportPayload());
        setImportExportStatus({ tone: "success", message: "PDF export completed." });
      } catch (err) {
        console.error(err);
        setImportExportStatus({ tone: "error", message: "PDF export failed. Please try again." });
      }
    });
  }, [buildExportPayload, runImportExportTask]);

  const onExportCsv = useCallback(async () => {
    await runImportExportTask(async () => {
      try {
        exportDashboardAsCsv(buildExportPayload());
        setImportExportStatus({ tone: "success", message: "CSV export completed." });
      } catch (err) {
        console.error(err);
        setImportExportStatus({ tone: "error", message: "CSV export failed. Please try again." });
      }
    });
  }, [buildExportPayload, runImportExportTask]);

  const onExportExcel = useCallback(async () => {
    await runImportExportTask(async () => {
      try {
        exportDashboardAsExcel(buildExportPayload());
        setImportExportStatus({ tone: "success", message: "Excel export completed." });
      } catch (err) {
        console.error(err);
        setImportExportStatus({ tone: "error", message: "Excel export failed. Please try again." });
      }
    });
  }, [buildExportPayload, runImportExportTask]);

  const onDownloadCsvTemplate = useCallback(async () => {
    await runImportExportTask(async () => {
      downloadCsvTemplate();
      setImportExportStatus({ tone: "info", message: "CSV template downloaded." });
    });
  }, [runImportExportTask]);

  const onDownloadExcelTemplate = useCallback(async () => {
    await runImportExportTask(async () => {
      downloadExcelTemplate();
      setImportExportStatus({ tone: "info", message: "Excel template downloaded." });
    });
  }, [runImportExportTask]);

  const lastUpdatedLabel = useMemo(() => {
    return new Date().toLocaleString();
  }, [summary]);

  return {
    filters,
    setFilters,
    summary,
    loading,
    error,
    insightState,
    requestInsight,
    refresh: loadDashboard,
    lastUpdatedLabel,
    onImportData,
    onExportPdf,
    onExportCsv,
    onExportExcel,
    onDownloadCsvTemplate,
    onDownloadExcelTemplate,
    importExportStatus,
    importExportBusy,
    dataSourceLabel
  };
};
