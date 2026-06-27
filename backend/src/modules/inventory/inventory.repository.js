import prisma from '../../common/database/prisma.js';

export class InventoryRepository {
  async findManyAndCount({ page, limit, search, lowStock }) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { item: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (lowStock === true) {
      const rawResults = await prisma.$queryRaw`
        SELECT id FROM "InventoryItem"
        WHERE "deletedAt" IS NULL AND quantity <= "minimumQuantity"
      `;
      const ids = rawResults.map((r) => r.id);
      where.id = { in: ids };
    } else if (lowStock === false) {
      const rawResults = await prisma.$queryRaw`
        SELECT id FROM "InventoryItem"
        WHERE "deletedAt" IS NULL AND quantity > "minimumQuantity"
      `;
      const ids = rawResults.map((r) => r.id);
      where.id = { in: ids };
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
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
      prisma.inventoryItem.count({
        where,
      }),
    ]);

    return { items, total };
  }

  async findById(id) {
    return prisma.inventoryItem.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        creator: true,
      },
    });
  }

  async create(data) {
    return prisma.inventoryItem.create({
      data,
      include: {
        creator: true,
      },
    });
  }

  async update(id, data) {
    return prisma.inventoryItem.update({
      where: { id },
      data,
      include: {
        creator: true,
      },
    });
  }

  async delete(id) {
    return prisma.inventoryItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export const inventoryRepository = new InventoryRepository();
