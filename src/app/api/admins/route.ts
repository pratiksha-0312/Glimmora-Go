import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(3).optional().nullable(),
  name: z.string().min(1),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  password: z.string().min(8),
  role: z
    .enum([
      "SUPER_ADMIN",
      "OPERATIONS_MANAGER",
      "FINANCE_ADMIN",
      "SUPPORT_AGENT",
      "PARTNER_MANAGER",
    ])
    .default("OPERATIONS_MANAGER"),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const d = parsed.data;

  try {
    const admin = await prisma.admin.create({
      data: {
        email: d.email,
        username: d.username || null,
        name: d.name,
        firstName: d.firstName || null,
        lastName: d.lastName || null,
        role: d.role,
        passwordHash: await hashPassword(d.password),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        cityId: true,
      },
    });
    await logAudit({
      session,
      action: "admin.create",
      entityType: "Admin",
      entityId: admin.id,
      summary: `${admin.email} · ${admin.role}`,
    });

    return NextResponse.json({ ok: true, admin });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint") && msg.includes("username")) {
      return NextResponse.json(
        { error: "Username already in use" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }
}
