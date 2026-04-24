import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
  verificationNote: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("drivers");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const driver = await prisma.driver.findUnique({
    where: { id },
    select: { cityId: true, status: true, name: true },
  });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, driver.cityId);
  if (scope) return scope;

  const updated = await prisma.driver.update({
    where: { id },
    data: parsed.data,
  });

  await logAudit({
    session: auth.session,
    action: parsed.data.status
      ? `driver.${parsed.data.status.toLowerCase()}`
      : "driver.update",
    entityType: "Driver",
    entityId: id,
    summary: `${driver.name}: ${driver.status} → ${updated.status}`,
    changes: { before: driver, after: parsed.data },
  });

  return NextResponse.json({ ok: true, driver: updated });
}
