import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin || !admin.active) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    cityId: admin.cityId,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
}
