import prisma from '../../common/database/prisma.js';

export class ExaminationsRepository {
  async findManyAndCount({ page, limit, patientId, doctorId }) {
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

    const [exams, total] = await Promise.all([
      prisma.medicalExamination.findMany({
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
          examDate: 'desc',
        },
      }),
      prisma.medicalExamination.count({
        where,
      }),
    ]);

    return { exams, total };
  }

  async findById(id) {
    return prisma.medicalExamination.findFirst({
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
    return prisma.medicalExamination.create({
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
    return prisma.medicalExamination.update({
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

export const examinationsRepository = new ExaminationsRepository();
