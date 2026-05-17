import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSummary, generateInsight } from "../services/api";
import type { DashboardFilters, DashboardSummary, InsightResponse } from "../types";

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
  ageBucketSize: 10,
  maxInsightWords: 150
};

export const useDashboardData = () => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [insightState, setInsightState] = useState<{
    loading: boolean;
    error: string | null;
    data: InsightResponse | null;
  }>({
    loading: false,
    error: null,
    data: null
  });

  const loadDashboard = useCallback(async () => {
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
  }, [filters.ageBucketSize, filters.categoryLimit]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const requestInsight = useCallback(async () => {
    try {
      setInsightState({ loading: true, error: null, data: null });
      const data = await generateInsight({
        summary,
        maxWords: filters.maxInsightWords
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
  }, [filters.maxInsightWords, summary]);

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
    lastUpdatedLabel
  };
};
