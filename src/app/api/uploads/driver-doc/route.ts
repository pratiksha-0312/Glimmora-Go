import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";
import { uploadFile, validateFile } from "@/lib/storage";
import type { DocumentType } from "../../../../../generated/prisma";

const VALID_TYPES: DocumentType[] = [
  "LICENSE",
  "RC",
  "INSURANCE",
  "AADHAAR",
  "PAN",
];

export async function POST(req: Request) {
  const auth = await requireWrite("documents");
  if (!auth.ok) return auth.response;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const driverId = form.get("driverId");
  const type = form.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }
  if (typeof driverId !== "string" || typeof type !== "string") {
    return NextResponse.json({ error: "driverId + type required" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type as DocumentType)) {
    return NextResponse.json(
      { error: `Invalid type. Expected one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const vErr = validateFile(file);
  if (vErr) return NextResponse.json({ error: vErr }, { status: 400 });

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { id: true, cityId: true },
  });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  const scope = cityMismatch(auth.session, driver.cityId);
  if (scope) return scope;

  const { url } = await uploadFile(file, `drivers/${driverId}`);

  const doc = await prisma.driverDocument.create({
    data: {
      driverId,
      type: type as DocumentType,
      fileUrl: url,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, document: doc });
}
