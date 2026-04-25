import { prisma } from "./db";

export async function periodTotals(
  partnerId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const rides = await prisma.ride.findMany({
    where: {
      bookedByPartnerId: partnerId,
      status: "COMPLETED",
      completedAt: { gte: periodStart, lt: periodEnd },
    },
    select: { fareFinal: true },
  });
  const grossFare = rides.reduce((s, r) => s + (r.fareFinal ?? 0), 0);
  return { rideCount: rides.length, grossFare };
}

export async function accruedSince(
  partnerId: string,
  since: Date | null,
  commissionPct: number
) {
  const rides = await prisma.ride.findMany({
    where: {
      bookedByPartnerId: partnerId,
      status: "COMPLETED",
      ...(since ? { completedAt: { gt: since } } : {}),
    },
    select: { fareFinal: true },
  });
  const grossFare = rides.reduce((s, r) => s + (r.fareFinal ?? 0), 0);
  return {
    rideCount: rides.length,
    grossFare,
    amount: Math.round((grossFare * commissionPct) / 100),
    since,
  };
}

export function formatPeriod(start: Date | string, end: Date | string): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  return `${fmt(s)} – ${fmt(e)}`;
}
