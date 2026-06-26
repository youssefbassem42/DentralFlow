import prisma from '../src/common/database/prisma.js';

describe('Prisma Database Connection', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully perform a query to check connectivity', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    expect(result).toBeDefined();
    expect(result[0].connected).toBe(1);
  });
});
