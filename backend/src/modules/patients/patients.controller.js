import { patientsService } from './patients.service.js';

export class PatientsController {
  getPatients = async (req, res, next) => {
    try {
      const data = await patientsService.getPatients(req.query);
      return res.status(200).json({
        success: true,
        message: 'Patients retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getPatient = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await patientsService.getPatientById(id);
      return res.status(200).json({
        success: true,
        message: 'Patient profile retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  registerPatient = async (req, res, next) => {
    try {
      const creatorId = req.user.id;
      const data = await patientsService.registerPatient(req.body, creatorId);
      return res.status(201).json({
        success: true,
        message: 'Patient registered successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  updatePatient = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await patientsService.updatePatient(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  deletePatient = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await patientsService.deletePatient(id);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: { id: result.id },
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const patientsController = new PatientsController();
