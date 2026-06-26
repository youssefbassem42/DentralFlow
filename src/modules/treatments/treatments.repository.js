import prisma from '../../common/database/prisma.js';

export class TreatmentsRepository {
  async findManyAndCount({ page, limit, patientId, doctorId, treatmentPlanId }) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (treatmentPlanId) {
      where.treatmentPlanId = treatmentPlanId;
    }

    const [treatments, total] = await Promise.all([
      prisma.treatment.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: true,
          doctor: {
            include: {
              user: true,
            },
          },
          treatmentPlan: true,
        },
        orderBy: {
          sessionDate: 'desc',
        },
      }),
      prisma.treatment.count({
        where,
      }),
    ]);

    return { treatments, total };
  }

  async findById(id) {
    return prisma.treatment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        treatmentPlan: true,
      },
    });
  }

  async create(data) {
    return prisma.treatment.create({
      data,
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        treatmentPlan: true,
      },
    });
  }

  async update(id, data) {
    return prisma.treatment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        treatmentPlan: true,
      },
    });
  }
}

export const treatmentsRepository = new TreatmentsRepository();
