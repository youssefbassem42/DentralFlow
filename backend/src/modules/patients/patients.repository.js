import prisma from '../../common/database/prisma.js';

export class PatientsRepository {
  async findManyAndCount({ page, limit, search, gender, bloodGroup, doctorId, status, lastVisit }) {
    const skip = (page - 1) * limit;

    // Construct filtering queries
    const where = {
      deletedAt: null,
    };

    const andConditions = [];

    if (gender) {
      andConditions.push({ gender: { equals: gender, mode: 'insensitive' } });
    }

    if (bloodGroup) {
      andConditions.push({ bloodGroup: { equals: bloodGroup, mode: 'insensitive' } });
    }

    if (search) {
      andConditions.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (doctorId) {
      andConditions.push({
        appointments: {
          some: {
            doctorId,
            deletedAt: null,
          },
        },
      });
    }

    if (status) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (status === 'Active') {
        andConditions.push({
          OR: [
            { createdAt: { gte: sixMonthsAgo } },
            {
              appointments: {
                some: {
                  appointmentDate: { gte: sixMonthsAgo },
                  deletedAt: null,
                },
              },
            },
          ],
        });
      } else if (status === 'Inactive') {
        andConditions.push({
          createdAt: { lt: sixMonthsAgo },
          appointments: {
            none: {
              appointmentDate: { gte: sixMonthsAgo },
              deletedAt: null,
            },
          },
        });
      }
    }

    if (lastVisit && lastVisit !== 'anyTime') {
      const cutoff = new Date();
      if (lastVisit === 'last30Days') {
        cutoff.setDate(cutoff.getDate() - 30);
      } else if (lastVisit === 'last6Months') {
        cutoff.setMonth(cutoff.getMonth() - 6);
      }
      andConditions.push({
        appointments: {
          some: {
            appointmentDate: { gte: cutoff, lte: new Date() },
            deletedAt: null,
          },
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Execute queries in parallel
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: true,
          appointments: {
            where: { deletedAt: null },
            orderBy: { appointmentDate: 'desc' },
          },
          treatments: {
            where: { deletedAt: null },
            orderBy: { sessionDate: 'desc' },
          },
          payments: {
            where: { deletedAt: null },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.patient.count({
        where,
      }),
    ]);

    return { patients, total };
  }

  async findById(id) {
    return prisma.patient.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        creator: true,
        appointments: {
          where: { deletedAt: null },
          orderBy: { appointmentDate: 'desc' },
        },
        treatments: {
          where: { deletedAt: null },
          orderBy: { sessionDate: 'desc' },
        },
        payments: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async findByPhone(phone) {
    return prisma.patient.findFirst({
      where: {
        phone,
        deletedAt: null,
      },
    });
  }

  async create(data) {
    return prisma.patient.create({
      data,
      include: {
        creator: true,
        appointments: {
          where: { deletedAt: null },
        },
        treatments: {
          where: { deletedAt: null },
        },
        payments: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.patient.update({
      where: { id },
      data,
      include: {
        creator: true,
        appointments: {
          where: { deletedAt: null },
          orderBy: { appointmentDate: 'desc' },
        },
        treatments: {
          where: { deletedAt: null },
          orderBy: { sessionDate: 'desc' },
        },
        payments: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async softDelete(id) {
    return prisma.patient.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export const patientsRepository = new PatientsRepository();
