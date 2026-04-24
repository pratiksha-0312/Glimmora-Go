import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

const addSchema = z.object({
  riderPhone: z.string().min(10).max(15),
  riderName: z.string().optional(),
  employeeId: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("corporates");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const corporate = await prisma.corporate.findUnique({
    where: { id },
    select: { cityId: true, name: true },
  });
  if (!corporate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, corporate.cityId);
  if (scope) return scope;

  // Create or reuse rider
  const rider = await prisma.rider.upsert({
    where: { phone: parsed.data.riderPhone },
    update: parsed.data.riderName ? { name: parsed.data.riderName } : {},
    create: {
      phone: parsed.data.riderPhone,
      name: parsed.data.riderName ?? null,
    },
  });

  try {
    const member = await prisma.corporateMember.create({
      data: {
        corporateId: id,
        riderId: rider.id,
        employeeId: parsed.data.employeeId ?? null,
      },
    });

    await logAudit({
      session: auth.session,
      action: "corporate.member.add",
      entityType: "CorporateMember",
      entityId: member.id,
      summary: `${corporate.name} + ${rider.phone}`,
    });

    return NextResponse.json({ ok: true, member });
  } catch {
    return NextResponse.json(
      { error: "Already a member of this corporate" },
      { status: 409 }
    );
  }
}
