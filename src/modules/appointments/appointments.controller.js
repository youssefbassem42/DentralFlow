import { appointmentsService } from './appointments.service.js';

export class AppointmentsController {
  getAppointments = async (req, res, next) => {
    try {
      const data = await appointmentsService.getAppointments(req.query);
      return res.status(200).json({
        success: true,
        message: 'Appointments retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getAppointment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await appointmentsService.getAppointmentById(id);
      return res.status(200).json({
        success: true,
        message: 'Appointment retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  createAppointment = async (req, res, next) => {
    try {
      const creatorId = req.user.id;
      const data = await appointmentsService.createAppointment(req.body, creatorId);
      return res.status(201).json({
        success: true,
        message: 'Appointment booked successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  updateAppointment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await appointmentsService.updateAppointment(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Appointment updated successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  deleteAppointment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await appointmentsService.deleteAppointment(id);
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

export const appointmentsController = new AppointmentsController();
