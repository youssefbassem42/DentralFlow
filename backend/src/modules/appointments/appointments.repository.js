import prisma from '../../common/database/prisma.js';

export class AppointmentsRepository {
  async findManyAndCount({ page, limit, doctorId, patientId, appointmentDate, today }) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (today === 'true' || today === true) {
      const todayDate = new Date();
      todayDate.setUTCHours(0, 0, 0, 0);
      where.appointmentDate = todayDate;
    } else if (appointmentDate) {
      const parsedDate = new Date(appointmentDate);
      parsedDate.setUTCHours(0, 0, 0, 0);
      where.appointmentDate = parsedDate;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
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
          creator: true,
        },
        orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
      }),
      prisma.appointment.count({
        where,
      }),
    ]);

    return { appointments, total };
  }

  async findById(id) {
    return prisma.appointment.findFirst({
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
        creator: true,
      },
    });
  }

  async checkConflict(doctorId, appointmentDate, appointmentTime, excludeId = null) {
    const normalizedDate = new Date(appointmentDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    return prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: normalizedDate,
        appointmentTime,
        status: { in: ['Scheduled', 'Completed'] },
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
  }

  async create(data) {
    const normalizedDate = new Date(data.appointmentDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    return prisma.appointment.create({
      data: {
        ...data,
        appointmentDate: normalizedDate,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        creator: true,
      },
    });
  }

  async update(id, data) {
    const updateData = { ...data };

    if (data.appointmentDate) {
      const normalizedDate = new Date(data.appointmentDate);
      normalizedDate.setUTCHours(0, 0, 0, 0);
      updateData.appointmentDate = normalizedDate;
    }

    return prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        creator: true,
      },
    });
  }

  async softDelete(id) {
    return prisma.appointment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'Cancelled',
      },
    });
  }
}

export const appointmentsRepository = new AppointmentsRepository();
