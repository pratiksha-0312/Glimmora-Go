import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { sendSms } from "@/lib/notify";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
  commissionPct: z.number().min(0).max(50).optional(),
  reviewNote: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("partners");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { cityId: true, status: true },
  });
  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, partner.cityId);
  if (scope) return scope;

  const isApproving =
    parsed.data.status === "APPROVED" && partner.status !== "APPROVED";

  const updated = await prisma.partner.update({
    where: { id },
    data: parsed.data,
  });

  await logAudit({
    session: auth.session,
    action: parsed.data.status
      ? `partner.${parsed.data.status.toLowerCase()}`
      : "partner.update",
    entityType: "Partner",
    entityId: id,
    summary: `${updated.shopName}${parsed.data.status ? ` → ${parsed.data.status}` : ""}`,
  });

  if (isApproving) {
    await sendSms(
      updated.phone,
      "partner_approved",
      `Glimmora Go: ${updated.shopName} is approved! Open the app to add bank details and upload KYC documents — required to receive your commission payouts.`,
      `partner-approved:${id}`
    );
  }

  return NextResponse.json({ ok: true, partner: updated });
}
