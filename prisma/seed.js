import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@dcms.com';
  const hashedPassword = await bcrypt.hash('AdminPass123!', 12);

  // Seed default admin
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      phone: '+1234567890',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Database seeded. Default admin created:', adminUser.email);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
