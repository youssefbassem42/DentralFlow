import { reportsRepository } from './reports.repository.js';

export class ReportsService {
  async getDashboardStats() {
    return reportsRepository.getDashboardStats();
  }

  async getRevenueReport(filters) {
    return reportsRepository.getRevenueReport(filters);
  }

  async getInventoryReport() {
    return reportsRepository.getInventoryReport();
  }
}

export const reportsService = new ReportsService();
