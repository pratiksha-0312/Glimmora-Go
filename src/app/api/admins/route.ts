import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const schema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8),
    role: z.enum([
      "SUPER_ADMIN",
      "ADMIN",
      "CITY_ADMIN",
      "VERIFIER",
      "SUPPORT",
      "VIEWER",
    ]),
    cityId: z.string().nullable().optional(),
  })
  .refine(
    (v) => v.role !== "CITY_ADMIN" || (v.cityId && v.cityId.length > 0),
    { message: "City Admin requires cityId", path: ["cityId"] }
  );

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, name, password, role, cityId } = parsed.data;

  try {
    const admin = await prisma.admin.create({
      data: {
        email,
        name,
        role,
        cityId: role === "CITY_ADMIN" ? cityId : null,
        passwordHash: await hashPassword(password),
      },
      select: {
        id: true,
        email: true,
        name: true,
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
  } catch {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }
}
