import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "SUSPENDED"]).optional(),
  reviewNote: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  gstin: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("corporates");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.corporate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, existing.cityId);
  if (scope) return scope;

  const updated = await prisma.corporate.update({
    where: { id },
    data: parsed.data,
  });

  await logAudit({
    session: auth.session,
    action: parsed.data.status
      ? `corporate.${parsed.data.status.toLowerCase()}`
      : "corporate.update",
    entityType: "Corporate",
    entityId: id,
    summary: `${updated.name}${parsed.data.status ? ` → ${parsed.data.status}` : ""}`,
  });

  return NextResponse.json({ ok: true, corporate: updated });
}
