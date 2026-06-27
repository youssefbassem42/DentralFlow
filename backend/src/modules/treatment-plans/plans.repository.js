import prisma from '../../common/database/prisma.js';

export class TreatmentPlansRepository {
  async findManyAndCount({ page, limit, patientId, doctorId, status }) {
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

    if (status) {
      where.status = status;
    }

    const [plans, total] = await Promise.all([
      prisma.treatmentPlan.findMany({
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.treatmentPlan.count({
        where,
      }),
    ]);

    return { plans, total };
  }

  async findById(id) {
    return prisma.treatmentPlan.findFirst({
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
      },
    });
  }

  async create(data) {
    return prisma.treatmentPlan.create({
      data,
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.treatmentPlan.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}

export const treatmentPlansRepository = new TreatmentPlansRepository();
