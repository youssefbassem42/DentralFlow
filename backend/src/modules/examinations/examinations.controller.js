import { examinationsService } from './examinations.service.js';

export class ExaminationsController {
  getExaminations = async (req, res, next) => {
    try {
      const data = await examinationsService.getExaminations(req.query);
      return res.status(200).json({
        success: true,
        message: 'Medical examinations retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getExamination = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await examinationsService.getExaminationById(id);
      return res.status(200).json({
        success: true,
        message: 'Medical examination retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  createExamination = async (req, res, next) => {
    try {
      const user = req.user;
      const data = await examinationsService.createExamination(req.body, user);
      return res.status(201).json({
        success: true,
        message: 'Medical examination recorded successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  updateExamination = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await examinationsService.updateExamination(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Medical examination updated successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const examinationsController = new ExaminationsController();
