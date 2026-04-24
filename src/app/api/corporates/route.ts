import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRead, requireWrite } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  gstin: z.string().optional().nullable(),
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(10).max(15),
  cityId: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const auth = await requireRead("corporates");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const corporates = await prisma.corporate.findMany({
    where: {
      ...(auth.session.cityId ? { cityId: auth.session.cityId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      city: { select: { name: true } },
      _count: { select: { members: true, rides: true } },
    },
  });
  return NextResponse.json({ corporates });
}

export async function POST(req: Request) {
  const auth = await requireWrite("corporates");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const corporate = await prisma.corporate.create({
      data: {
        ...parsed.data,
        cityId: parsed.data.cityId ?? null,
      },
    });

    await logAudit({
      session: auth.session,
      action: "corporate.create",
      entityType: "Corporate",
      entityId: corporate.id,
      summary: `${corporate.name} · ${corporate.contactEmail}`,
    });

    return NextResponse.json({ ok: true, corporate });
  } catch {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }
}
