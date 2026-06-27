import prisma from '../../common/database/prisma.js';

export class UsersRepository {
  async findMany(filters = {}) {
    const where = { deletedAt: null };
    if (filters.role) {
      where.role = filters.role;
    }
    return prisma.user.findMany({
      where,
      include: {
        doctor: true,
        receptionist: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id) {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        doctor: true,
        receptionist: true,
      },
    });
  }

  async findByEmail(email) {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      include: {
        doctor: true,
        receptionist: true,
      },
    });
  }

  async create(payload) {
    const { name, email, password, phone, role, specialization, licenseNumber, shift } = payload;

    return prisma.$transaction(async (tx) => {
      // Create core user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password,
          phone,
          role,
          status: 'ACTIVE',
        },
      });

      // Create role-specific records
      if (role === 'DOCTOR') {
        await tx.doctor.create({
          data: {
            id: user.id,
            specialization: specialization || null,
            licenseNumber: licenseNumber || null,
          },
        });
      } else if (role === 'RECEPTIONIST') {
        await tx.receptionist.create({
          data: {
            id: user.id,
            shift: shift || null,
          },
        });
      }

      // Re-query with includes
      return tx.user.findUnique({
        where: { id: user.id },
        include: { doctor: true, receptionist: true },
      });
    });
  }

  async update(id, payload) {
    const { name, email, password, phone, status, specialization, licenseNumber, shift } = payload;

    return prisma.$transaction(async (tx) => {
      // Find current user role
      const currentUser = await tx.user.findUnique({
        where: { id },
      });

      if (!currentUser) return null;

      // Update core user details
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (password !== undefined) updateData.password = password;
      if (phone !== undefined) updateData.phone = phone;
      if (status !== undefined) updateData.status = status;

      const user = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Update role-specific details
      if (currentUser.role === 'DOCTOR') {
        const doctorData = {};
        if (specialization !== undefined) doctorData.specialization = specialization;
        if (licenseNumber !== undefined) doctorData.licenseNumber = licenseNumber;

        if (Object.keys(doctorData).length > 0) {
          await tx.doctor.update({
            where: { id },
            data: doctorData,
          });
        }
      } else if (currentUser.role === 'RECEPTIONIST') {
        const receptionistData = {};
        if (shift !== undefined) receptionistData.shift = shift;

        if (Object.keys(receptionistData).length > 0) {
          await tx.receptionist.update({
            where: { id },
            data: receptionistData,
          });
        }
      }

      // Re-query with includes
      return tx.user.findUnique({
        where: { id: user.id },
        include: { doctor: true, receptionist: true },
      });
    });
  }

  async softDelete(id) {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
      // Soft delete user
      const user = await tx.user.update({
        where: { id },
        data: {
          deletedAt: now,
          status: 'INACTIVE',
        },
      });

      // Soft delete doctor relation
      if (user.role === 'DOCTOR') {
        await tx.doctor.update({
          where: { id },
          data: { deletedAt: now },
        });
      }

      // Soft delete receptionist relation
      if (user.role === 'RECEPTIONIST') {
        await tx.receptionist.update({
          where: { id },
          data: { deletedAt: now },
        });
      }

      return user;
    });
  }
}

export const usersRepository = new UsersRepository();
