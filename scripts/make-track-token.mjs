// Picks the most recent in-flight ride (or any ride if none in-flight),
// gives it a trackingToken if missing, and prints the shareable URL.
import { PrismaClient } from "../generated/prisma/index.js";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();
const IN_FLIGHT = ["REQUESTED", "MATCHED", "EN_ROUTE", "ARRIVED", "IN_TRIP"];

const ride =
  (await prisma.ride.findFirst({
    where: { status: { in: IN_FLIGHT } },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, trackingToken: true, pickupAddress: true, dropAddress: true },
  })) ??
  (await prisma.ride.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, trackingToken: true, pickupAddress: true, dropAddress: true },
  }));

if (!ride) {
  console.log("No rides in the DB. Run `npm run db:seed` first.");
  process.exit(1);
}

const token = ride.trackingToken ?? randomBytes(16).toString("hex");
if (!ride.trackingToken) {
  await prisma.ride.update({ where: { id: ride.id }, data: { trackingToken: token } });
}

console.log("Ride id:    ", ride.id);
console.log("Status:     ", ride.status);
console.log("Pickup:     ", ride.pickupAddress);
console.log("Drop:       ", ride.dropAddress);
console.log("\nOpen this URL in any browser (no login needed):");
console.log(`http://localhost:3000/track/${token}`);

await prisma.$disconnect();
