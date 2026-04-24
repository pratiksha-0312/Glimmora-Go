import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  verifyOtp,
  createKiranaToken,
  setKiranaCookie,
} from "@/lib/kiranaAuth";

const schema = z.object({
  phone: z.string().regex(/^\d{10}$/),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { phone, code } = parsed.data;
  const ok = await verifyOtp(phone, code, "KIRANA_LOGIN");
  if (!ok) {
    return NextResponse.json(
      { error: "Wrong or expired code" },
      { status: 401 }
    );
  }

  const partner = await prisma.kiranaPartner.findUnique({ where: { phone } });
  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const token = await createKiranaToken({
    partnerId: partner.id,
    phone: partner.phone,
    shopName: partner.shopName,
  });
  await setKiranaCookie(token);
  return NextResponse.json({ ok: true, status: partner.status });
}
