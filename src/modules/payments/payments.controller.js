import { paymentsService } from './payments.service.js';

export class PaymentsController {
  getPayments = async (req, res, next) => {
    try {
      const data = await paymentsService.getPayments(req.query);
      return res.status(200).json({
        success: true,
        message: 'Payments and revenue summary retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  createPayment = async (req, res, next) => {
    try {
      const data = await paymentsService.createPayment(req.body);
      return res.status(201).json({
        success: true,
        message: 'Payment recorded successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getPatientFinancial = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await paymentsService.getPatientFinancial(id);
      return res.status(200).json({
        success: true,
        message: 'Patient financial history retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const paymentsController = new PaymentsController();
