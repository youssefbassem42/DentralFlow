import { treatmentPlansService } from './plans.service.js';

export class TreatmentPlansController {
  getTreatmentPlans = async (req, res, next) => {
    try {
      const data = await treatmentPlansService.getTreatmentPlans(req.query);
      return res.status(200).json({
        success: true,
        message: 'Treatment plans retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getTreatmentPlan = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await treatmentPlansService.getTreatmentPlanById(id);
      return res.status(200).json({
        success: true,
        message: 'Treatment plan retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  createTreatmentPlan = async (req, res, next) => {
    try {
      const user = req.user;
      const data = await treatmentPlansService.createTreatmentPlan(req.body, user);
      return res.status(201).json({
        success: true,
        message: 'Treatment plan created successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  updateTreatmentPlan = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await treatmentPlansService.updateTreatmentPlan(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Treatment plan updated successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const treatmentPlansController = new TreatmentPlansController();
