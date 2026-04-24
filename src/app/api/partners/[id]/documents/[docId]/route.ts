import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { deleteFile } from "@/lib/storage";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const auth = await requireWrite("partners");
  if (!auth.ok) return auth.response;

  const { id, docId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const doc = await prisma.partnerDocument.findUnique({
    where: { id: docId },
    include: { partner: { select: { cityId: true } } },
  });
  if (!doc || doc.partnerId !== id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, doc.partner.cityId);
  if (scope) return scope;

  const updated = await prisma.partnerDocument.update({
    where: { id: docId },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true, document: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const auth = await requireWrite("partners");
  if (!auth.ok) return auth.response;

  const { id, docId } = await params;
  const doc = await prisma.partnerDocument.findUnique({
    where: { id: docId },
    include: { partner: { select: { cityId: true } } },
  });
  if (!doc || doc.partnerId !== id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, doc.partner.cityId);
  if (scope) return scope;

  await deleteFile(doc.fileUrl);
  await prisma.partnerDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
