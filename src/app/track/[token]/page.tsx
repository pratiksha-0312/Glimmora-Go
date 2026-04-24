import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TrackView } from "./TrackView";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 8) notFound();

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
      city: { select: { name: true } },
      driver: {
        select: { name: true, phone: true, lat: true, lng: true, online: true },
      },
    },
  });

  if (!ride) notFound();

  return (
    <TrackView
      token={token}
      initial={{
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
        driver: ride.driver
          ? {
              name: ride.driver.name,
              phone: ride.driver.phone,
              online: ride.driver.online,
              lat: ride.driver.lat,
              lng: ride.driver.lng,
            }
          : null,
      }}
    />
  );
}
