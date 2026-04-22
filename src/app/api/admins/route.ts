import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "VIEWER"]).default("ADMIN"),
});

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

  const { email, name, password, role } = parsed.data;

  try {
    const admin = await prisma.admin.create({
      data: {
        email,
        name,
        role,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    return NextResponse.json({ ok: true, admin });
  } catch {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }
}
