import { reportsService } from './reports.service.js';

export class ReportsController {
  getDashboard = async (req, res, next) => {
    try {
      const data = await reportsService.getDashboardStats();
      return res.status(200).json({
        success: true,
        message: 'Dashboard report stats compiled successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getRevenue = async (req, res, next) => {
    try {
      const data = await reportsService.getRevenueReport(req.query);
      return res.status(200).json({
        success: true,
        message: 'Revenue report compiled successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getInventory = async (req, res, next) => {
    try {
      const data = await reportsService.getInventoryReport();
      return res.status(200).json({
        success: true,
        message: 'Warehouse inventory report compiled successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const reportsController = new ReportsController();
