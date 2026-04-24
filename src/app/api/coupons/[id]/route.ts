import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite } from "@/lib/apiAuth";

const patchSchema = z.object({
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("coupons");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true, coupon });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("coupons");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
