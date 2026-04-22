import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Glimmora Go admin data...");

  // Admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.admin.upsert({
    where: { email: "admin@glimmora.ai" },
    update: {},
    create: {
      email: "admin@glimmora.ai",
      name: "Pratiksha",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`  admin: ${admin.email} / admin123`);

  // Cities
  const cities = [
    {
      name: "Rewa",
      state: "Madhya Pradesh",
      archetype: "SMALL_TOWN" as const,
      matchingRadiusKm: 7,
      surgeMultiplier: 1.0,
      paymentOptions: ["CASH", "UPI"],
    },
    {
      name: "Indore",
      state: "Madhya Pradesh",
      archetype: "METRO" as const,
      matchingRadiusKm: 3,
      surgeMultiplier: 1.2,
      paymentOptions: ["CASH", "UPI", "CARD"],
    },
    {
      name: "Lucknow",
      state: "Uttar Pradesh",
      archetype: "METRO" as const,
      matchingRadiusKm: 3,
      surgeMultiplier: 1.2,
      paymentOptions: ["CASH", "UPI", "CARD"],
    },
  ];

  for (const c of cities) {
    const city = await prisma.city.upsert({
      where: { name: c.name },
      update: {},
      create: {
        ...c,
        fareConfig: {
          create: {
            baseFare: c.archetype === "METRO" ? 40 : 30,
            perKm: c.archetype === "METRO" ? 14 : 12,
            perMin: 1.5,
            minimumFare: c.archetype === "METRO" ? 60 : 50,
          },
        },
      },
    });
    console.log(`  city: ${city.name}`);
  }

  // Drivers
  const rewa = await prisma.city.findUnique({ where: { name: "Rewa" } });
  const indore = await prisma.city.findUnique({ where: { name: "Indore" } });

  const drivers = [
    {
      phone: "9876501001",
      name: "Rajesh Kumar",
      cityId: rewa?.id,
      status: "APPROVED" as const,
      online: true,
    },
    {
      phone: "9876501002",
      name: "Suresh Yadav",
      cityId: rewa?.id,
      status: "PENDING" as const,
    },
    {
      phone: "9876501003",
      name: "Amit Singh",
      cityId: indore?.id,
      status: "APPROVED" as const,
      online: true,
    },
    {
      phone: "9876501004",
      name: "Ramesh Gupta",
      cityId: indore?.id,
      status: "PENDING" as const,
    },
  ];

  for (const d of drivers) {
    await prisma.driver.upsert({
      where: { phone: d.phone },
      update: {},
      create: d,
    });
  }
  console.log(`  drivers: ${drivers.length}`);

  // Riders
  const rider1 = await prisma.rider.upsert({
    where: { phone: "9999900001" },
    update: {},
    create: { phone: "9999900001", name: "Priya Sharma", language: "hi" },
  });
  const rider2 = await prisma.rider.upsert({
    where: { phone: "9999900002" },
    update: {},
    create: { phone: "9999900002", name: "Anjali Verma", language: "en" },
  });

  // Sample rides
  const approvedDrivers = await prisma.driver.findMany({
    where: { status: "APPROVED" },
  });

  if (rewa && approvedDrivers.length > 0) {
    await prisma.ride.createMany({
      data: [
        {
          riderId: rider1.id,
          driverId: approvedDrivers[0].id,
          cityId: rewa.id,
          pickupAddress: "Rewa Station, Civil Lines",
          pickupLat: 24.5336,
          pickupLng: 81.3035,
          dropAddress: "Civil Hospital, Rewa",
          dropLat: 24.5421,
          dropLng: 81.2956,
          distanceKm: 3.2,
          durationMin: 12,
          fareEstimate: 80,
          fareFinal: 78,
          concessionType: "WOMEN",
          status: "COMPLETED",
          bookingChannel: "APP",
          completedAt: new Date(),
        },
        {
          riderId: rider2.id,
          cityId: rewa.id,
          pickupAddress: "Main Market, Rewa",
          pickupLat: 24.5312,
          pickupLng: 81.3014,
          dropAddress: "Rewa Railway Station",
          dropLat: 24.536,
          dropLng: 81.302,
          distanceKm: 2.1,
          durationMin: 8,
          fareEstimate: 60,
          status: "REQUESTED",
          bookingChannel: "SMS",
        },
      ],
    });
    console.log(`  rides: 2`);
  }

  // Coupons
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  await prisma.coupon.upsert({
    where: { code: "FIRSTRIDE" },
    update: {},
    create: {
      code: "FIRSTRIDE",
      description: "First ride free (up to ₹100)",
      discountType: "FLAT",
      amount: 100,
      usageLimit: 1000,
      validUntil: in30Days,
    },
  });
  await prisma.coupon.upsert({
    where: { code: "MONSOON20" },
    update: {},
    create: {
      code: "MONSOON20",
      description: "20% off",
      discountType: "PERCENT",
      amount: 20,
      maxDiscount: 50,
      usageLimit: 5000,
      validUntil: in30Days,
    },
  });
  console.log(`  coupons: 2`);

  console.log("\n✅ Seed complete.");
  console.log("\nLogin: admin@glimmora.ai / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
