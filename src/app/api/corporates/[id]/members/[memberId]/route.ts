import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const auth = await requireWrite("corporates");
  if (!auth.ok) return auth.response;

  const { id, memberId } = await params;
  const corporate = await prisma.corporate.findUnique({
    where: { id },
    select: { cityId: true, name: true },
  });
  if (!corporate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, corporate.cityId);
  if (scope) return scope;

  await prisma.corporateMember.delete({ where: { id: memberId } });

  await logAudit({
    session: auth.session,
    action: "corporate.member.remove",
    entityType: "CorporateMember",
    entityId: memberId,
    summary: corporate.name,
  });

  return NextResponse.json({ ok: true });
}
