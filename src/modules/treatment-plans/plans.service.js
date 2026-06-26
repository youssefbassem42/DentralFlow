import { treatmentPlansRepository } from './plans.repository.js';
import prisma from '../../common/database/prisma.js';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError.js';
import { TreatmentPlanDto } from './plans.dto.js';

export class TreatmentPlansService {
  async getTreatmentPlans(query) {
    const { page, limit, patientId, doctorId, status } = query;

    const { plans, total } = await treatmentPlansRepository.findManyAndCount({
      page,
      limit,
      patientId,
      doctorId,
      status,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      plans: TreatmentPlanDto.array(plans),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getTreatmentPlanById(id) {
    const plan = await treatmentPlansRepository.findById(id);
    if (!plan) {
      throw new NotFoundError('Treatment plan not found.');
    }
    return new TreatmentPlanDto(plan);
  }

  async createTreatmentPlan(payload, user) {
    const { patientId, title, description, estimatedCost, estimatedSessions } = payload;

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
            'Admin must specify a doctorId in the payload to create a treatment plan.'
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

    const plan = await treatmentPlansRepository.create({
      patientId,
      doctorId,
      title,
      description,
      estimatedCost,
      estimatedSessions,
      status: 'Pending',
    });

    return new TreatmentPlanDto(plan);
  }

  async updateTreatmentPlan(id, payload) {
    const plan = await treatmentPlansRepository.findById(id);
    if (!plan) {
      throw new NotFoundError('Treatment plan not found.');
    }

    const updated = await treatmentPlansRepository.update(id, payload);
    return new TreatmentPlanDto(updated);
  }
}

export const treatmentPlansService = new TreatmentPlansService();
