import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  amount: z.number(),
  note: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("corporates");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || parsed.data.amount === 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const corporate = await prisma.corporate.findUnique({ where: { id } });
  if (!corporate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, corporate.cityId);
  if (scope) return scope;

  const [, topUp, updated] = await prisma.$transaction([
    prisma.corporate.update({
      where: { id },
      data: { walletBalance: { increment: parsed.data.amount } },
    }),
    prisma.corporateTopUp.create({
      data: {
        corporateId: id,
        amount: parsed.data.amount,
        note: parsed.data.note ?? null,
        createdByAdminId: auth.session.adminId,
      },
    }),
    prisma.corporate.findUnique({ where: { id } }),
  ]);

  await logAudit({
    session: auth.session,
    action: parsed.data.amount > 0 ? "corporate.topup" : "corporate.debit",
    entityType: "Corporate",
    entityId: id,
    summary: `${corporate.name}: ₹${parsed.data.amount}`,
  });

  return NextResponse.json({ ok: true, topUp, corporate: updated });
}
