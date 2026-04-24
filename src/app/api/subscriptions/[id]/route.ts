import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite } from "@/lib/apiAuth";

const patchSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("subscriptions");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: { active: parsed.data.active },
  });

  if (!parsed.data.active) {
    const stillActive = await prisma.subscription.findFirst({
      where: {
        driverId: sub.driverId,
        active: true,
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: "desc" },
    });
    await prisma.driver.update({
      where: { id: sub.driverId },
      data: { subscriptionUntil: stillActive?.expiresAt ?? null },
    });
  }

  return NextResponse.json({ ok: true, subscription: updated });
}
