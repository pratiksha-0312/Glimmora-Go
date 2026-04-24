import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partnerAuth";
import { uploadFile, validateFile } from "@/lib/storage";

const VALID_TYPES = new Set([
  "SHOP_LICENSE",
  "AADHAAR",
  "PAN",
  "PHOTO",
  "OTHER",
]);

export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form)
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  const type = form.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }
  if (typeof type !== "string" || !VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: `Invalid type. Expected one of: ${[...VALID_TYPES].join(", ")}` },
      { status: 400 }
    );
  }

  const vErr = validateFile(file);
  if (vErr) return NextResponse.json({ error: vErr }, { status: 400 });

  const { url } = await uploadFile(file, `partners/${session.partnerId}`);

  const doc = await prisma.partnerDocument.create({
    data: {
      partnerId: session.partnerId,
      type,
      fileUrl: url,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, document: doc });
}
