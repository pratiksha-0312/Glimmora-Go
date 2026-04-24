import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRead } from "@/lib/apiAuth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRead("riders");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const rider = await prisma.rider.findUnique({
    where: { id },
    include: {
      rides: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          fareFinal: true,
          fareEstimate: true,
          pickupAddress: true,
          dropAddress: true,
          createdAt: true,
          completedAt: true,
          bookingChannel: true,
        },
      },
    },
  });
  if (!rider) {
    return NextResponse.json({ error: "Rider not found" }, { status: 404 });
  }

  const completed = rider.rides.filter((r) => r.status === "COMPLETED");
  const lifetimeSpend = completed.reduce(
    (sum, r) => sum + (r.fareFinal ?? 0),
    0
  );

  return NextResponse.json({
    rider,
    stats: {
      totalRides: rider.rides.length,
      completedRides: completed.length,
      lifetimeSpend,
    },
  });
}
