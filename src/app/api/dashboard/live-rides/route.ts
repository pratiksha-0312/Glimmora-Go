import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRead } from "@/lib/apiAuth";
import { RideStatus } from "../../../../../generated/prisma";

const IN_FLIGHT: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.EN_ROUTE,
  RideStatus.ARRIVED,
  RideStatus.IN_TRIP,
];

export async function GET() {
  const auth = await requireRead("dashboard");
  if (!auth.ok) return auth.response;

  const cityFilter = auth.session.cityId
    ? { cityId: auth.session.cityId }
    : {};

  const rides = await prisma.ride.findMany({
    where: {
      ...cityFilter,
      status: { in: IN_FLIGHT },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      pickupAddress: true,
      dropAddress: true,
      fareEstimate: true,
      sosTriggered: true,
      createdAt: true,
      rider: { select: { phone: true, name: true } },
      driver: { select: { name: true } },
      city: { select: { name: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    rides: rides.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
