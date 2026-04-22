import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const patchSchema = z.object({
  action: z.enum(["CANCEL", "COMPLETE", "REASSIGN"]),
  driverId: z.string().optional(),
  fareFinal: z.number().min(0).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) {
    return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  }

  if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
    return NextResponse.json(
      { error: `Ride already ${ride.status.toLowerCase()}` },
      { status: 409 }
    );
  }

  const { action, driverId, fareFinal } = parsed.data;

  if (action === "CANCEL") {
    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ ok: true, ride: updated });
  }

  if (action === "COMPLETE") {
    const updated = await prisma.ride.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        fareFinal: fareFinal ?? ride.fareFinal ?? ride.fareEstimate,
      },
    });
    return NextResponse.json({ ok: true, ride: updated });
  }

  if (action === "REASSIGN") {
    if (!driverId) {
      return NextResponse.json(
        { error: "driverId required for reassign" },
        { status: 400 }
      );
    }
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver || driver.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Driver must be approved" },
        { status: 400 }
      );
    }
    const updated = await prisma.ride.update({
      where: { id },
      data: { driverId, status: "MATCHED" },
    });
    return NextResponse.json({ ok: true, ride: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
