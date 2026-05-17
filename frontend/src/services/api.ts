import axios from "axios";
import type {
  AgeTrend,
  DashboardSummary,
  InsightResponse,
  Kpis,
  RegionDistribution,
  TopCategory
} from "../types";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const isLocalHostname = (hostname: string): boolean => hostname === "localhost" || hostname === "127.0.0.1";

const getDefaultApiBaseUrl = (): string => {
  if (typeof window !== "undefined" && !isLocalHostname(window.location.hostname)) {
    return "https://datainsights-backend.onrender.com/api";
  }

  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl(),
  timeout: 15000
});

export const fetchKpis = async (): Promise<Kpis> => {
  const response = await api.get<ApiResponse<Kpis>>("/analytics/kpis");
  return response.data.data;
};

export const fetchTopCategories = async (limit: number): Promise<TopCategory[]> => {
  const response = await api.get<ApiResponse<TopCategory[]>>("/analytics/top-categories", {
    params: { limit }
  });
  return response.data.data;
};

export const fetchRegionalDistribution = async (): Promise<RegionDistribution[]> => {
  const response = await api.get<ApiResponse<RegionDistribution[]>>("/analytics/regional-distribution");
  return response.data.data;
};

export const fetchAgeTrend = async (bucketSize: number): Promise<AgeTrend[]> => {
  const response = await api.get<ApiResponse<AgeTrend[]>>("/analytics/trend", {
    params: { bucketSize }
  });
  return response.data.data;
};

export const fetchSummary = async (categoryLimit: number, ageBucketSize: number): Promise<DashboardSummary> => {
  const [kpis, topCategories, regionalDistribution, ageTrend] = await Promise.all([
    fetchKpis(),
    fetchTopCategories(categoryLimit),
    fetchRegionalDistribution(),
    fetchAgeTrend(ageBucketSize)
  ]);

  return {
    kpis,
    topCategories,
    regionalDistribution,
    ageTrend
  };
};

export const generateInsight = async (payload: {
  summary: DashboardSummary;
  maxWords: number;
}): Promise<InsightResponse> => {
  const response = await api.post<ApiResponse<InsightResponse>>("/ai/insight", payload);
  return response.data.data;
};

export default api;
