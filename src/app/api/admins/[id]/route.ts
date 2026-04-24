import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (id === session.adminId && parsed.data.active === false) {
    return NextResponse.json(
      { error: "Cannot deactivate your own account" },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.password) data.passwordHash = await hashPassword(parsed.data.password);

  const admin = await prisma.admin.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  await logAudit({
    session,
    action: "admin.update",
    entityType: "Admin",
    entityId: id,
    summary: `${admin.email} · ${Object.keys(data).join(", ")}`,
  });

  return NextResponse.json({ ok: true, admin });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (id === session.adminId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const existing = await prisma.admin.findUnique({
    where: { id },
    select: { email: true },
  });
  await prisma.admin.delete({ where: { id } });

  await logAudit({
    session,
    action: "admin.delete",
    entityType: "Admin",
    entityId: id,
    summary: existing?.email ?? id,
  });

  return NextResponse.json({ ok: true });
}
