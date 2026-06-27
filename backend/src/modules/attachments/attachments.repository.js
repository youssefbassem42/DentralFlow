import prisma from '../../common/database/prisma.js';

export class AttachmentsRepository {
  async findManyAndCount({ page, limit, doctorId, fileType }) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (fileType) {
      where.fileType = fileType;
    }

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({
        where,
        skip,
        take: limit,
        include: {
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
      prisma.attachment.count({
        where,
      }),
    ]);

    return { attachments, total };
  }

  async findById(id) {
    return prisma.attachment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async create(data) {
    return prisma.attachment.create({
      data,
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async delete(id) {
    return prisma.attachment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export const attachmentsRepository = new AttachmentsRepository();
