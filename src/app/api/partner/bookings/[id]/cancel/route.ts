import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partnerAuth";

const CANCELLABLE = ["REQUESTED", "MATCHED", "EN_ROUTE", "ARRIVED"] as const;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPartnerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const ride = await prisma.ride.findUnique({
    where: { id },
    select: { id: true, status: true, bookedByPartnerId: true, couponCode: true },
  });
  if (!ride || ride.bookedByPartnerId !== session.partnerId)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!CANCELLABLE.includes(ride.status as (typeof CANCELLABLE)[number]))
    return NextResponse.json(
      { error: `Cannot cancel a ${ride.status.toLowerCase()} ride` },
      { status: 400 }
    );

  await prisma.$transaction(async (tx) => {
    await tx.ride.update({
      where: { id: ride.id },
      data: { status: "CANCELLED" },
    });
    // Refund the coupon usage so the partner can retry with the same code.
    if (ride.couponCode) {
      await tx.coupon.updateMany({
        where: { code: ride.couponCode },
        data: { usedCount: { decrement: 1 } },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
