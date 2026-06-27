import { treatmentsService } from './treatments.service.js';

export class TreatmentsController {
  getTreatments = async (req, res, next) => {
    try {
      const data = await treatmentsService.getTreatments(req.query);
      return res.status(200).json({
        success: true,
        message: 'Treatment sessions retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getTreatment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await treatmentsService.getTreatmentById(id);
      return res.status(200).json({
        success: true,
        message: 'Treatment session retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  createTreatment = async (req, res, next) => {
    try {
      const user = req.user;
      const data = await treatmentsService.createTreatment(req.body, user);
      return res.status(201).json({
        success: true,
        message: 'Treatment session recorded successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  updateTreatment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await treatmentsService.updateTreatment(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Treatment session updated successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const treatmentsController = new TreatmentsController();
