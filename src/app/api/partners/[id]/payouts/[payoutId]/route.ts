import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { sendSms } from "@/lib/notify";

const patchSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED"]),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; payoutId: string }> }
) {
  const auth = await requireWrite("partners");
  if (!auth.ok) return auth.response;

  const { id, payoutId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: { partner: { select: { cityId: true, shopName: true, phone: true } } },
  });
  if (!payout || payout.partnerId !== id) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  const scope = cityMismatch(auth.session, payout.partner.cityId);
  if (scope) return scope;

  const isMarkingPaid =
    parsed.data.status === "PAID" && payout.status !== "PAID";

  const updated = await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: parsed.data.status,
      reference: parsed.data.reference ?? payout.reference,
      note: parsed.data.note ?? payout.note,
      paidAt: isMarkingPaid ? new Date() : parsed.data.status === "PAID" ? payout.paidAt : null,
      paidById: isMarkingPaid ? auth.session.adminId : parsed.data.status === "PAID" ? payout.paidById : null,
    },
  });

  await logAudit({
    session: auth.session,
    action: `payout.${parsed.data.status.toLowerCase()}`,
    entityType: "Payout",
    entityId: payoutId,
    summary: `${payout.partner.shopName} · ₹${updated.amount} → ${parsed.data.status}${
      parsed.data.reference ? ` · ${parsed.data.reference}` : ""
    }`,
  });

  if (isMarkingPaid) {
    await sendSms(
      payout.partner.phone,
      "partner_payout_paid",
      `Glimmora Go: ₹${updated.amount} paid to ${payout.partner.shopName}.${
        updated.reference ? ` Ref: ${updated.reference}.` : ""
      }`,
      `payout:${payoutId}`
    );
  } else if (parsed.data.status === "FAILED") {
    await sendSms(
      payout.partner.phone,
      "partner_payout_failed",
      `Glimmora Go: payout of ₹${updated.amount} for ${payout.partner.shopName} failed. We're looking into it.`,
      `payout:${payoutId}`
    );
  }

  return NextResponse.json({ ok: true, payout: updated });
}
