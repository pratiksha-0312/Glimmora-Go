import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partnerAuth";
import { deleteFile } from "@/lib/storage";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await getPartnerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;
  const doc = await prisma.partnerDocument.findUnique({
    where: { id: docId },
    select: { id: true, partnerId: true, fileUrl: true, status: true },
  });
  if (!doc || doc.partnerId !== session.partnerId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (doc.status === "APPROVED") {
    return NextResponse.json(
      { error: "Cannot delete an approved document. Contact support." },
      { status: 400 }
    );
  }

  await deleteFile(doc.fileUrl);
  await prisma.partnerDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
