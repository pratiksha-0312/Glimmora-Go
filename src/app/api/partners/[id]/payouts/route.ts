import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRead, requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { accruedSince, periodTotals } from "@/lib/payouts";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRead("partners");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { cityId: true, commissionPct: true },
  });
  if (!partner)
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const scope = cityMismatch(auth.session, partner.cityId);
  if (scope) return scope;

  const payouts = await prisma.payout.findMany({
    where: { partnerId: id },
    orderBy: { periodEnd: "desc" },
    include: { paidBy: { select: { name: true } } },
  });
  const lastEnd = payouts[0]?.periodEnd ?? null;
  const accrued = await accruedSince(id, lastEnd, partner.commissionPct);

  return NextResponse.json({
    ok: true,
    payouts,
    accrued,
    commissionPct: partner.commissionPct,
  });
}

const createSchema = z
  .object({
    periodStart: z.string().datetime({ offset: true }).or(z.string()),
    periodEnd: z.string().datetime({ offset: true }).or(z.string()),
    note: z.string().optional(),
  })
  .refine((d) => new Date(d.periodStart) < new Date(d.periodEnd), {
    message: "periodStart must be before periodEnd",
  });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("partners");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { cityId: true, commissionPct: true, shopName: true },
  });
  if (!partner)
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const scope = cityMismatch(auth.session, partner.cityId);
  if (scope) return scope;

  const periodStart = new Date(parsed.data.periodStart);
  const periodEnd = new Date(parsed.data.periodEnd);

  const { rideCount, grossFare } = await periodTotals(id, periodStart, periodEnd);
  if (rideCount === 0) {
    return NextResponse.json(
      { error: "No completed rides in this period" },
      { status: 400 }
    );
  }

  const amount = Math.round((grossFare * partner.commissionPct) / 100);

  const payout = await prisma.payout.create({
    data: {
      partnerId: id,
      periodStart,
      periodEnd,
      rideCount,
      grossFare,
      commissionPct: partner.commissionPct,
      amount,
      note: parsed.data.note,
    },
  });

  await logAudit({
    session: auth.session,
    action: "payout.create",
    entityType: "Payout",
    entityId: payout.id,
    summary: `${partner.shopName} · ${rideCount} rides · ₹${amount}`,
  });

  return NextResponse.json({ ok: true, payout });
}
