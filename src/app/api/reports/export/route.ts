import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

function parseDays(value: string | null, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 365) return fallback;
  return Math.floor(n);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "reports")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const days = parseDays(url.searchParams.get("days"), 7);
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const cityFilter = session.cityId ? { cityId: session.cityId } : {};

  const rides = await prisma.ride.findMany({
    where: { ...cityFilter, createdAt: { gte: from } },
    orderBy: { createdAt: "desc" },
    include: {
      rider: { select: { phone: true, name: true } },
      driver: { select: { phone: true, name: true } },
      city: { select: { name: true } },
    },
  });

  const header = [
    "ride_id",
    "created_at",
    "completed_at",
    "status",
    "booking_channel",
    "city",
    "rider_name",
    "rider_phone",
    "driver_name",
    "driver_phone",
    "pickup",
    "drop",
    "distance_km",
    "duration_min",
    "fare_estimate",
    "fare_final",
    "concession",
    "coupon_code",
    "coupon_discount",
    "sos",
    "rating",
  ];

  const lines = [header.join(",")];
  for (const r of rides) {
    lines.push(
      [
        r.id,
        r.createdAt.toISOString(),
        r.completedAt?.toISOString() ?? "",
        r.status,
        r.bookingChannel,
        r.city.name,
        r.rider.name ?? "",
        r.rider.phone,
        r.driver?.name ?? "",
        r.driver?.phone ?? "",
        r.pickupAddress,
        r.dropAddress,
        r.distanceKm ?? "",
        r.durationMin ?? "",
        r.fareEstimate,
        r.fareFinal ?? "",
        r.concessionType,
        r.couponCode ?? "",
        r.couponDiscount ?? "",
        r.sosTriggered ? "yes" : "no",
        r.rating ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = lines.join("\n");
  const filename = `rides-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
