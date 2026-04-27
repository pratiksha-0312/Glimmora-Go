import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partnerAuth";
import { calcFare, haversineKm } from "@/lib/fare";

const bookSchema = z.object({
  riderPhone: z.string().regex(/^\d{10}$/),
  riderName: z.string().optional(),
  pickupAddress: z.string().min(1),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropAddress: z.string().min(1),
  dropLat: z.number(),
  dropLng: z.number(),
  couponCode: z.string().min(1).optional(),
});

const estimateSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropLat: z.number(),
  dropLng: z.number(),
  couponCode: z.string().min(1).optional(),
});

type CouponApplied = {
  code: string;
  couponId: string;
  discount: number;
};

// Validate a coupon code and compute the discount in INR. Returns the
// applied coupon info or an error string. Discount is capped so the fare
// never goes below 0.
async function applyCoupon(
  rawCode: string,
  fareBefore: number
): Promise<{ ok: true; applied: CouponApplied } | { ok: false; error: string }> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) return { ok: false, error: "Invalid coupon" };
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil)
    return { ok: false, error: "Coupon is not currently valid" };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, error: "Coupon usage limit reached" };

  let discount =
    coupon.discountType === "FLAT"
      ? coupon.amount
      : Math.round((fareBefore * coupon.amount) / 100);
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, fareBefore);
  discount = Math.max(0, Math.round(discount));

  return { ok: true, applied: { code, couponId: coupon.id, discount } };
}

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
  const parsed = bookSchema.safeParse(body);
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
  const durationMin = Math.max(5, Math.round(distanceKm * 3));

  const fareBefore = calcFare({
    baseFare: fc.baseFare,
    perKm: fc.perKm,
    perMin: fc.perMin,
    minimumFare: fc.minimumFare,
    surgeMultiplier: partner.city.surgeMultiplier,
    distanceKm,
    durationMin,
  });

  let fareEstimate = fareBefore;
  let coupon: CouponApplied | null = null;
  if (d.couponCode) {
    const result = await applyCoupon(d.couponCode, fareBefore);
    if (!result.ok)
      return NextResponse.json({ error: result.error }, { status: 400 });
    coupon = result.applied;
    fareEstimate = Math.max(0, fareBefore - coupon.discount);
  }

  // Find or create the rider
  const rider = await prisma.rider.upsert({
    where: { phone: d.riderPhone },
    update: d.riderName ? { name: d.riderName } : {},
    create: { phone: d.riderPhone, name: d.riderName },
  });

  const ride = await prisma.$transaction(async (tx) => {
    const created = await tx.ride.create({
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
        couponCode: coupon?.code ?? null,
        couponDiscount: coupon?.discount ?? null,
        status: "REQUESTED",
        bookingChannel: "PARTNER",
        bookedByPartnerId: partner.id,
      },
    });
    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }
    return created;
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
  const parsed = estimateSchema.safeParse(body);
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
  const fareBefore = calcFare({
    baseFare: fc.baseFare,
    perKm: fc.perKm,
    perMin: fc.perMin,
    minimumFare: fc.minimumFare,
    surgeMultiplier: partner.city.surgeMultiplier,
    distanceKm,
    durationMin,
  });

  let fareEstimate = fareBefore;
  let couponDiscount = 0;
  let appliedCode: string | null = null;
  if (d.couponCode) {
    const result = await applyCoupon(d.couponCode, fareBefore);
    if (!result.ok)
      return NextResponse.json({ error: result.error }, { status: 400 });
    couponDiscount = result.applied.discount;
    appliedCode = result.applied.code;
    fareEstimate = Math.max(0, fareBefore - couponDiscount);
  }

  return NextResponse.json({
    ok: true,
    fareEstimate,
    fareBeforeDiscount: fareBefore,
    couponDiscount,
    couponCode: appliedCode,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin,
    commissionEstimate: Math.round((fareEstimate * partner.commissionPct) / 100),
  });
}
