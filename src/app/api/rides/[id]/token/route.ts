import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";

function genToken(): string {
  return randomBytes(16).toString("hex");
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("rides");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const ride = await prisma.ride.findUnique({
    where: { id },
    select: { cityId: true, trackingToken: true },
  });
  if (!ride) {
    return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, ride.cityId);
  if (scope) return scope;

  const token = ride.trackingToken ?? genToken();
  if (!ride.trackingToken) {
    await prisma.ride.update({ where: { id }, data: { trackingToken: token } });
  }

  return NextResponse.json({ ok: true, token });
}
