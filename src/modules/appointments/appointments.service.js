import { appointmentsRepository } from './appointments.repository.js';
import prisma from '../../common/database/prisma.js';
import { NotFoundError, ConflictError } from '../../common/errors/AppError.js';
import { AppointmentDto } from './appointments.dto.js';

export class AppointmentsService {
  async getAppointments(query) {
    const { page, limit, doctorId, patientId, appointmentDate, today } = query;

    const { appointments, total } = await appointmentsRepository.findManyAndCount({
      page,
      limit,
      doctorId,
      patientId,
      appointmentDate,
      today,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      appointments: AppointmentDto.array(appointments),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getAppointmentById(id) {
    const appt = await appointmentsRepository.findById(id);
    if (!appt) {
      throw new NotFoundError('Appointment not found.');
    }
    return new AppointmentDto(appt);
  }

  async createAppointment(payload, creatorId) {
    const { patientId, doctorId, appointmentDate, appointmentTime } = payload;

    // Verify Patient exists
    const patientExists = await prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
    });
    if (!patientExists) {
      throw new NotFoundError('Patient not found.');
    }

    // Verify Doctor exists
    const doctorExists = await prisma.doctor.findFirst({
      where: { id: doctorId, deletedAt: null },
    });
    if (!doctorExists) {
      throw new NotFoundError('Doctor not found.');
    }

    // Verify Conflict / Double Booking
    const conflict = await appointmentsRepository.checkConflict(
      doctorId,
      appointmentDate,
      appointmentTime
    );
    if (conflict) {
      throw new ConflictError('Doctor is already booked at this date and time.');
    }

    const appt = await appointmentsRepository.create({
      ...payload,
      createdBy: creatorId,
    });

    return new AppointmentDto(appt);
  }

  async updateAppointment(id, payload) {
    const appt = await appointmentsRepository.findById(id);
    if (!appt) {
      throw new NotFoundError('Appointment not found.');
    }

    const doctorId = payload.doctorId || appt.doctorId;
    const appointmentDate = payload.appointmentDate || appt.appointmentDate;
    const appointmentTime = payload.appointmentTime || appt.appointmentTime;

    // If changing doctor, verify new doctor exists
    if (payload.doctorId && payload.doctorId !== appt.doctorId) {
      const doctorExists = await prisma.doctor.findFirst({
        where: { id: payload.doctorId, deletedAt: null },
      });
      if (!doctorExists) {
        throw new NotFoundError('Doctor not found.');
      }
    }

    // If changing patient, verify new patient exists
    if (payload.patientId && payload.patientId !== appt.patientId) {
      const patientExists = await prisma.patient.findFirst({
        where: { id: payload.patientId, deletedAt: null },
      });
      if (!patientExists) {
        throw new NotFoundError('Patient not found.');
      }
    }

    // Check conflict
    const conflict = await appointmentsRepository.checkConflict(
      doctorId,
      appointmentDate,
      appointmentTime,
      id
    );
    if (conflict) {
      throw new ConflictError('Doctor is already booked at this date and time.');
    }

    const updated = await appointmentsRepository.update(id, payload);
    return new AppointmentDto(updated);
  }

  async deleteAppointment(id) {
    const appt = await appointmentsRepository.findById(id);
    if (!appt) {
      throw new NotFoundError('Appointment not found.');
    }

    await appointmentsRepository.softDelete(id);
    return { id, message: 'Appointment cancelled/deleted successfully.' };
  }
}

export const appointmentsService = new AppointmentsService();
