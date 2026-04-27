import { PrismaClient } from '../generated/prisma';

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  const adminCols = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Admin' ORDER BY column_name");
  const rideCols = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Ride' ORDER BY column_name");
  const otpCols = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'OtpRequest' ORDER BY column_name");

  const roles = await prisma.$queryRawUnsafe('SELECT role, COUNT(*) AS count FROM "Admin" GROUP BY role ORDER BY role');
  const admins = await prisma.$queryRawUnsafe('SELECT id, email, name, role FROM "Admin" ORDER BY role, email');
  const booking = await prisma.$queryRawUnsafe('SELECT "bookingChannel", COUNT(*) AS count FROM "Ride" GROUP BY "bookingChannel" ORDER BY "bookingChannel"');
  const purpose = await prisma.$queryRawUnsafe('SELECT purpose, COUNT(*) AS count FROM "OtpRequest" GROUP BY purpose ORDER BY purpose');

  console.log('tables', tables);
  console.log('adminCols', adminCols);
  console.log('rideCols', rideCols);
  console.log('otpCols', otpCols);
  console.log('roles', roles);
  console.log('admins', admins);
  console.log('booking', booking);
  console.log('purpose', purpose);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
