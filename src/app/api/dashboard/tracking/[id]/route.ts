import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRead, cityMismatch } from "@/lib/apiAuth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRead("tracking");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const ride = await prisma.ride.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      cityId: true,
      pickupAddress: true,
      pickupLat: true,
      pickupLng: true,
      dropAddress: true,
      dropLat: true,
      dropLng: true,
      sosTriggered: true,
      createdAt: true,
      city: { select: { name: true } },
      rider: { select: { name: true, phone: true } },
      driver: {
        select: { name: true, phone: true, online: true, lat: true, lng: true },
      },
    },
  });
  if (!ride) {
    return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  }

  const scope = cityMismatch(auth.session, ride.cityId);
  if (scope) return scope;

  return NextResponse.json({
    ok: true,
    ride: {
      id: ride.id,
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
      city: ride.city.name,
      driver: ride.driver,
      rider: ride.rider,
      sosTriggered: ride.sosTriggered,
    },
  });
}
