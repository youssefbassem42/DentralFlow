import api from '@/lib/api';
import type {
  DashboardReportData,
  RevenueReportData,
  InventoryReportData,
} from './types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getDashboardReport = async (): Promise<ApiResponse<DashboardReportData>> => {
  return api.get('/reports/dashboard');
};

export const getRevenueReport = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<RevenueReportData>> => {
  return api.get('/reports/revenue', { params });
};

export const getInventoryReport = async (): Promise<ApiResponse<InventoryReportData>> => {
  return api.get('/reports/inventory');
};
