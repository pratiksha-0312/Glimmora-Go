import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partnerAuth";
import { calcFare, haversineKm } from "@/lib/fare";

const schema = z.object({
  riderPhone: z.string().regex(/^\d{10}$/),
  riderName: z.string().optional(),
  pickupAddress: z.string().min(1),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropAddress: z.string().min(1),
  dropLat: z.number(),
  dropLng: z.number(),
  concession: z.enum(["NONE", "WOMEN", "SENIOR", "CHILDREN"]).default("NONE"),
});

export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    include: { city: { include: { fareConfig: true } } },
  });
  if (!partner)
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  if (partner.status !== "APPROVED")
    return NextResponse.json({ error: "Partner not approved" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const fc = partner.city.fareConfig;
  if (!fc) {
    return NextResponse.json(
      { error: "City fare not configured" },
      { status: 500 }
    );
  }

  const distanceKm = haversineKm(
    { lat: d.pickupLat, lng: d.pickupLng },
    { lat: d.dropLat, lng: d.dropLng }
  );
  const durationMin = Math.max(5, Math.round(distanceKm * 3)); // rough

  const concessionMultiplier =
    d.concession === "WOMEN"
      ? fc.womenMultiplier
      : d.concession === "SENIOR"
        ? fc.seniorMultiplier
        : d.concession === "CHILDREN"
          ? fc.childrenMultiplier
          : 1;

  const fareEstimate = calcFare({
    baseFare: fc.baseFare,
    perKm: fc.perKm,
    perMin: fc.perMin,
    minimumFare: fc.minimumFare,
    surgeMultiplier: partner.city.surgeMultiplier,
    distanceKm,
    durationMin,
    concession:
      d.concession === "NONE"
        ? { type: "NONE" }
        : { type: d.concession, multiplier: concessionMultiplier },
  });

  // Find or create the rider
  const rider = await prisma.rider.upsert({
    where: { phone: d.riderPhone },
    update: d.riderName ? { name: d.riderName } : {},
    create: { phone: d.riderPhone, name: d.riderName },
  });

  const ride = await prisma.ride.create({
    data: {
      riderId: rider.id,
      cityId: partner.cityId,
      pickupAddress: d.pickupAddress,
      pickupLat: d.pickupLat,
      pickupLng: d.pickupLng,
      dropAddress: d.dropAddress,
      dropLat: d.dropLat,
      dropLng: d.dropLng,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin,
      fareEstimate,
      concessionType: d.concession,
      status: "REQUESTED",
      bookingChannel: "PARTNER",
      bookedByPartnerId: partner.id,
    },
  });

  return NextResponse.json({
    ok: true,
    ride: {
      id: ride.id,
      status: ride.status,
      fareEstimate: ride.fareEstimate,
      distanceKm: ride.distanceKm,
      durationMin: ride.durationMin,
    },
  });
}

// Fare estimate without creating a ride
export async function PUT(req: Request) {
  const session = await getPartnerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    include: { city: { include: { fareConfig: true } } },
  });
  if (!partner || !partner.city.fareConfig) {
    return NextResponse.json(
      { error: "Fare not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const estSchema = z.object({
    pickupLat: z.number(),
    pickupLng: z.number(),
    dropLat: z.number(),
    dropLng: z.number(),
    concession: z.enum(["NONE", "WOMEN", "SENIOR", "CHILDREN"]).default("NONE"),
  });
  const parsed = estSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  const fc = partner.city.fareConfig;
  const distanceKm = haversineKm(
    { lat: d.pickupLat, lng: d.pickupLng },
    { lat: d.dropLat, lng: d.dropLng }
  );
  const durationMin = Math.max(5, Math.round(distanceKm * 3));
  const concessionMultiplier =
    d.concession === "WOMEN"
      ? fc.womenMultiplier
      : d.concession === "SENIOR"
        ? fc.seniorMultiplier
        : d.concession === "CHILDREN"
          ? fc.childrenMultiplier
          : 1;
  const fareEstimate = calcFare({
    baseFare: fc.baseFare,
    perKm: fc.perKm,
    perMin: fc.perMin,
    minimumFare: fc.minimumFare,
    surgeMultiplier: partner.city.surgeMultiplier,
    distanceKm,
    durationMin,
    concession:
      d.concession === "NONE"
        ? { type: "NONE" }
        : { type: d.concession, multiplier: concessionMultiplier },
  });

  return NextResponse.json({
    ok: true,
    fareEstimate,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin,
    commissionEstimate: Math.round((fareEstimate * partner.commissionPct) / 100),
  });
}
