import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().nullable().optional(),
  resolution: z.string().max(4000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("tickets");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, existing.cityId);
  if (scope) return scope;

  const nowResolving =
    parsed.data.status === "RESOLVED" && existing.status !== "RESOLVED";

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...parsed.data,
      resolvedAt: nowResolving ? new Date() : undefined,
    },
  });

  await logAudit({
    session: auth.session,
    action: "ticket.update",
    entityType: "Ticket",
    entityId: id,
    summary: `${existing.status} → ${updated.status}`,
    changes: { before: existing, after: updated },
  });

  return NextResponse.json({ ok: true, ticket: updated });
}
