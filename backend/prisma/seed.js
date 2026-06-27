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

  const doctorEmail = 'doctor@dcms.com';
  const doctorUser = await prisma.user.upsert({
    where: { email: doctorEmail },
    update: {},
    create: {
      name: 'Dr. Sarah Jenkins',
      email: doctorEmail,
      password: hashedPassword,
      phone: '+1234567891',
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  const receptionistEmail = 'receptionist@dcms.com';
  const receptionistUser = await prisma.user.upsert({
    where: { email: receptionistEmail },
    update: {},
    create: {
      name: 'Jane Doe',
      email: receptionistEmail,
      password: hashedPassword,
      phone: '+1234567892',
      role: 'RECEPTIONIST',
      status: 'ACTIVE',
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Database seeded. Created: admin, doctor, receptionist.');
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
