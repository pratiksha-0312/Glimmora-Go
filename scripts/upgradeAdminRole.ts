import { PrismaClient } from '../generated/prisma';

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const addType = async (value: string) => {
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS '${value}'`);
      console.log('Added AdminRole value:', value);
    } catch (err) {
      console.error('Could not add AdminRole value', value, err);
    }
  };

  await addType('OPERATIONS_MANAGER');
  await addType('FINANCE_ADMIN');
  await addType('SUPPORT_AGENT');
  await addType('PARTNER_MANAGER');

  await prisma.$executeRawUnsafe(`UPDATE "Admin" SET role = 'SUPER_ADMIN' WHERE role = 'ADMIN'`);
  await prisma.$executeRawUnsafe(`UPDATE "Admin" SET role = 'OPERATIONS_MANAGER' WHERE role = 'CITY_ADMIN'`);
  await prisma.$executeRawUnsafe(`UPDATE "Admin" SET role = 'SUPPORT_AGENT' WHERE role IN ('VERIFIER', 'SUPPORT', 'VIEWER')`);

  const counts = await prisma.$queryRawUnsafe('SELECT role, COUNT(*) AS count FROM "Admin" GROUP BY role ORDER BY role');
  console.log('Updated role counts:', counts);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
