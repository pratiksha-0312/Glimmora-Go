import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Glimmora Go admin data...");

  // Archetype defaults (used when creating new cities)
  await prisma.archetypeDefaults.upsert({
    where: { archetype: "METRO" },
    update: {},
    create: {
      archetype: "METRO",
      matchingRadiusKm: 3,
      surgeMultiplier: 1.2,
      paymentOptions: ["CASH", "UPI", "CARD"],
      baseFare: 40,
      perKm: 14,
      perMin: 1.5,
      minimumFare: 60,
    },
  });
  await prisma.archetypeDefaults.upsert({
    where: { archetype: "SMALL_TOWN" },
    update: {},
    create: {
      archetype: "SMALL_TOWN",
      matchingRadiusKm: 7,
      surgeMultiplier: 1.0,
      paymentOptions: ["CASH", "UPI"],
      baseFare: 30,
      perKm: 12,
      perMin: 1.5,
      minimumFare: 50,
    },
  });
  console.log("  archetype defaults: METRO + SMALL_TOWN");

  // Admins — one per role
  const pwd = await bcrypt.hash("admin123", 10);
  const superAdmin = await prisma.admin.upsert({
    where: { email: "admin@glimmora.ai" },
    update: {},
    create: {
      email: "admin@glimmora.ai",
      name: "Pratiksha",
      passwordHash: pwd,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`  super_admin: ${superAdmin.email} / admin123`);

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

  // Remaining admin roles
  const roleAccounts: {
    email: string;
    name: string;
    role: "ADMIN" | "CITY_ADMIN" | "VERIFIER" | "SUPPORT" | "VIEWER";
    cityId?: string;
  }[] = [
    { email: "admin2@glimmora.ai", name: "General Admin", role: "ADMIN" },
    {
      email: "rewa.admin@glimmora.ai",
      name: "Rewa City Admin",
      role: "CITY_ADMIN",
      cityId: rewa?.id,
    },
    { email: "verifier@glimmora.ai", name: "Doc Verifier", role: "VERIFIER" },
    { email: "support@glimmora.ai", name: "Support Agent", role: "SUPPORT" },
    { email: "viewer@glimmora.ai", name: "Read-Only Viewer", role: "VIEWER" },
  ];

  for (const r of roleAccounts) {
    const a = await prisma.admin.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        name: r.name,
        passwordHash: pwd,
        role: r.role,
        cityId: r.cityId ?? null,
      },
    });
    console.log(`  ${r.role.toLowerCase()}: ${a.email} / admin123`);
  }

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

  // Kirana partners
  if (rewa) {
    await prisma.kiranaPartner.upsert({
      where: { phone: "9888800001" },
      update: {},
      create: {
        phone: "9888800001",
        shopName: "Ramji Kirana Store",
        ownerName: "Ram Kumar",
        cityId: rewa.id,
        commissionPct: 10,
        status: "APPROVED",
      },
    });
    console.log("  kirana (approved): Ramji Kirana Store / 9888800001");
  }
  if (indore) {
    await prisma.kiranaPartner.upsert({
      where: { phone: "9888800002" },
      update: {},
      create: {
        phone: "9888800002",
        shopName: "Sharma General Stores",
        ownerName: "Sharma",
        cityId: indore.id,
        commissionPct: 12,
        status: "PENDING",
      },
    });
    console.log("  kirana (pending):  Sharma General Stores / 9888800002");
  }

  // Sample support ticket
  if (rider1 && approvedDrivers[0] && rewa) {
    const existing = await prisma.ticket.findFirst({
      where: { subject: "AC not working" },
    });
    if (!existing) {
      await prisma.ticket.create({
        data: {
          category: "RIDE_ISSUE",
          priority: "NORMAL",
          subject: "AC not working",
          description:
            "Rider reports that the car AC was off during a 20-minute ride in Rewa. Asks for fare adjustment.",
          riderId: rider1.id,
          driverId: approvedDrivers[0].id,
          cityId: rewa.id,
          status: "OPEN",
        },
      });
      console.log("  ticket: sample RIDE_ISSUE");
    }
  }

  // Sample corporate account
  if (indore) {
    const corp = await prisma.corporate.upsert({
      where: { contactEmail: "ops@acmecabs.in" },
      update: {},
      create: {
        name: "Acme Logistics Pvt Ltd",
        gstin: "23AABCU9603R1ZM",
        contactName: "Priya Mehta",
        contactEmail: "ops@acmecabs.in",
        contactPhone: "9999000111",
        cityId: indore.id,
        walletBalance: 5000,
        status: "APPROVED",
      },
    });
    await prisma.corporateMember.upsert({
      where: {
        corporateId_riderId: {
          corporateId: corp.id,
          riderId: rider2.id,
        },
      },
      update: {},
      create: {
        corporateId: corp.id,
        riderId: rider2.id,
        employeeId: "ACM-104",
      },
    });
    console.log(`  corporate: ${corp.name} (approved, 1 member)`);
  }

  console.log("\n✅ Seed complete.");
  console.log("\nLogin: admin@glimmora.ai / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
