import { requireRead } from "@/lib/apiAuth";
import { prisma } from "@/lib/db";
import type { RideStatus } from "../../../../../generated/prisma";

export async function GET(req: Request) {
  const auth = await requireRead("rides");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const channel = searchParams.get("channel");

  const cityFilter = auth.session.cityId ? { cityId: auth.session.cityId } : {};

  const where: Record<string, unknown> = { ...cityFilter };
  if (status && status !== "ALL") where.status = status as RideStatus;
  if (channel) where.bookingChannel = channel;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
    };
  }

  const searchFilter: Record<string, unknown> = search
    ? {
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { rider: { name: { contains: search, mode: "insensitive" } } },
          { rider: { phone: { contains: search } } },
          { driver: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};

  const rides = await prisma.ride.findMany({
    where: { ...where, ...searchFilter },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      rider: { select: { name: true, phone: true } },
      driver: { select: { name: true, phone: true } },
      city: { select: { name: true } },
    },
  });

  const headers = [
    "Ride ID", "Rider Name", "Rider Phone",
    "Driver Name", "Driver Phone",
    "Pickup", "Drop", "Channel",
    "Fare Estimate", "Fare Final", "Status",
    "City", "Created At", "Scheduled At",
  ];

  const escape = (v: string | number | null | undefined) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = rides.map((r) => [
    r.id,
    r.rider.name ?? "",
    r.rider.phone,
    r.driver?.name ?? "",
    r.driver?.phone ?? "",
    r.pickupAddress,
    r.dropAddress,
    r.bookingChannel,
    r.fareEstimate,
    r.fareFinal ?? "",
    r.status,
    r.city.name,
    r.createdAt.toISOString(),
    r.scheduledAt?.toISOString() ?? "",
  ].map(escape).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `rides-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
