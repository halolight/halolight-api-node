import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@halolight.com' },
    update: {},
    create: {
      email: 'admin@halolight.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
      status: 'active',
    },
  });

  console.log('Admin user created:', admin);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@halolight.com' },
    update: {},
    create: {
      email: 'demo@halolight.com',
      name: 'Demo User',
      password: demoPassword,
      role: Role.USER,
      status: 'active',
    },
  });

  console.log('Demo user created:', demo);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
