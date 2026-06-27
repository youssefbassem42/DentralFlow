import prisma from '../../common/database/prisma.js';

export class PatientsRepository {
  async findManyAndCount({ page, limit, search, gender, bloodGroup }) {
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
      },
    });
  }

  async update(id, data) {
    return prisma.patient.update({
      where: { id },
      data,
      include: {
        creator: true,
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
