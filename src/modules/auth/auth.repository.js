import prisma from '../../common/database/prisma.js';

export class AuthRepository {
  async findByEmail(email) {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }
}

export const authRepository = new AuthRepository();
