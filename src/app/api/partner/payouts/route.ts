import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partnerAuth";
import { accruedSince } from "@/lib/payouts";

export async function GET() {
  const session = await getPartnerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    select: { commissionPct: true },
  });
  if (!partner)
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const payouts = await prisma.payout.findMany({
    where: { partnerId: session.partnerId },
    orderBy: { periodEnd: "desc" },
  });

  const lastEnd = payouts[0]?.periodEnd ?? null;
  const accrued = await accruedSince(
    session.partnerId,
    lastEnd,
    partner.commissionPct
  );

  return NextResponse.json({
    ok: true,
    payouts,
    accrued,
    commissionPct: partner.commissionPct,
  });
}
