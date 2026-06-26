import { treatmentsRepository } from './treatments.repository.js';
import prisma from '../../common/database/prisma.js';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError.js';
import { TreatmentDto } from './treatments.dto.js';

export class TreatmentsService {
  async getTreatments(query) {
    const { page, limit, patientId, doctorId, treatmentPlanId } = query;

    const { treatments, total } = await treatmentsRepository.findManyAndCount({
      page,
      limit,
      patientId,
      doctorId,
      treatmentPlanId,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      treatments: TreatmentDto.array(treatments),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getTreatmentById(id) {
    const treatment = await treatmentsRepository.findById(id);
    if (!treatment) {
      throw new NotFoundError('Treatment session not found.');
    }
    return new TreatmentDto(treatment);
  }

  async createTreatment(payload, user) {
    const {
      patientId,
      treatmentPlanId,
      treatmentName,
      toothNumber,
      procedure,
      price,
      sessionDate,
      notes,
    } = payload;

    let doctorId = payload.doctorId;

    if (user.role === 'DOCTOR') {
      doctorId = user.id;
    } else if (user.role === 'ADMIN') {
      if (!doctorId) {
        const docRecord = await prisma.doctor.findUnique({ where: { id: user.id } });
        if (docRecord) {
          doctorId = user.id;
        } else {
          throw new BadRequestError(
            'Admin must specify a doctorId in the payload to record a treatment.'
          );
        }
      }
    }

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

    // Verify TreatmentPlan exists
    const planExists = await prisma.treatmentPlan.findFirst({
      where: { id: treatmentPlanId, deletedAt: null },
    });
    if (!planExists) {
      throw new NotFoundError('Treatment plan not found.');
    }

    const treatment = await treatmentsRepository.create({
      patientId,
      doctorId,
      treatmentPlanId,
      treatmentName,
      toothNumber,
      procedure,
      price,
      sessionDate: new Date(sessionDate),
      notes,
    });

    return new TreatmentDto(treatment);
  }

  async updateTreatment(id, payload) {
    const treatment = await treatmentsRepository.findById(id);
    if (!treatment) {
      throw new NotFoundError('Treatment session not found.');
    }

    const updated = await treatmentsRepository.update(id, payload);
    return new TreatmentDto(updated);
  }
}

export const treatmentsService = new TreatmentsService();
