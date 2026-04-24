import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { deleteFile } from "@/lib/storage";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const auth = await requireWrite("documents");
  if (!auth.ok) return auth.response;

  const { id, docId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const doc = await prisma.driverDocument.findUnique({
    where: { id: docId },
    include: { driver: { select: { cityId: true } } },
  });
  if (!doc || doc.driverId !== id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, doc.driver.cityId);
  if (scope) return scope;

  const updated = await prisma.driverDocument.update({
    where: { id: docId },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true, document: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const auth = await requireWrite("documents");
  if (!auth.ok) return auth.response;

  const { id, docId } = await params;
  const doc = await prisma.driverDocument.findUnique({
    where: { id: docId },
    include: { driver: { select: { cityId: true } } },
  });
  if (!doc || doc.driverId !== id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, doc.driver.cityId);
  if (scope) return scope;

  await deleteFile(doc.fileUrl);
  await prisma.driverDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
