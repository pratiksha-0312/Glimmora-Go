import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ride = await prisma.ride.findUnique({
    where: { trackingToken: token },
    select: {
      status: true,
      pickupAddress: true,
      pickupLat: true,
      pickupLng: true,
      dropAddress: true,
      dropLat: true,
      dropLng: true,
      distanceKm: true,
      durationMin: true,
      createdAt: true,
      completedAt: true,
      city: { select: { name: true } },
      driver: {
        select: {
          name: true,
          phone: true,
          lat: true,
          lng: true,
          online: true,
        },
      },
    },
  });

  if (!ride) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: ride.status,
    pickup: {
      address: ride.pickupAddress,
      lat: ride.pickupLat,
      lng: ride.pickupLng,
    },
    drop: {
      address: ride.dropAddress,
      lat: ride.dropLat,
      lng: ride.dropLng,
    },
    distanceKm: ride.distanceKm,
    durationMin: ride.durationMin,
    startedAt: ride.createdAt,
    completedAt: ride.completedAt,
    city: ride.city.name,
    driver: ride.driver
      ? {
          name: ride.driver.name,
          phone: ride.driver.phone,
          online: ride.driver.online,
          lat: ride.driver.lat,
          lng: ride.driver.lng,
        }
      : null,
  });
}
