// Seeds 5 COMPLETED partner-booked rides for Ramji Kirana Store so the
// admin payout flow has something to generate against. Idempotent — wipes
// prior demo rides + demo payouts for this partner before recreating.
//
// Run: node scripts/seed-payout-demo.mjs

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const partner = await prisma.partner.findUnique({
    where: { phone: "9888800001" },
  });
  if (!partner) throw new Error("Ramji Kirana Store not seeded — run prisma seed first");

  const rider = await prisma.rider.findFirst();
  const driver = await prisma.driver.findFirst({ where: { status: "APPROVED" } });
  if (!rider || !driver) throw new Error("Need at least one rider and one approved driver");

  // Wipe prior demo data for this partner so the run is fresh
  await prisma.payout.deleteMany({ where: { partnerId: partner.id } });
  await prisma.ride.deleteMany({ where: { bookedByPartnerId: partner.id } });
  await prisma.partnerDocument.deleteMany({ where: { partnerId: partner.id } });

  // Bank details + one approved KYC doc — required by the new payout gates
  await prisma.partner.update({
    where: { id: partner.id },
    data: {
      bankAccountName: "Ramji Patel",
      bankAccountNumber: "1234567890",
      bankIfsc: "HDFC0001234",
      bankName: "HDFC Bank",
    },
  });
  await prisma.partnerDocument.create({
    data: {
      partnerId: partner.id,
      type: "SHOP_LICENSE",
      fileUrl: "https://example.com/demo-license.pdf",
      status: "APPROVED",
    },
  });

  const fares = [180, 220, 165, 240, 195];
  for (let i = 0; i < fares.length; i++) {
    const daysAgo = i + 1; // spread across the last 5 days
    const created = new Date();
    created.setDate(created.getDate() - daysAgo);
    created.setHours(10 + i, 15, 0, 0);
    const completed = new Date(created.getTime() + 18 * 60_000);

    await prisma.ride.create({
      data: {
        riderId: rider.id,
        driverId: driver.id,
        cityId: partner.cityId,
        pickupAddress: "Ramji Kirana Store, Civil Lines",
        pickupLat: 24.5336,
        pickupLng: 81.3035,
        dropAddress: "Civil Hospital, Rewa",
        dropLat: 24.5421,
        dropLng: 81.2956,
        distanceKm: 2 + (i % 3),
        durationMin: 9 + i,
        fareEstimate: fares[i],
        fareFinal: fares[i],
        status: "COMPLETED",
        bookingChannel: "PARTNER",
        bookedByPartnerId: partner.id,
        createdAt: created,
        completedAt: completed,
      },
    });
  }

  const total = fares.reduce((a, b) => a + b, 0);
  const expected = Math.round((total * partner.commissionPct) / 100);
  console.log(
    `Seeded ${fares.length} partner-booked rides for ${partner.shopName}.`
  );
  console.log(
    `  gross: ₹${total} · commission: ${partner.commissionPct}% · expected payout: ₹${expected}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
