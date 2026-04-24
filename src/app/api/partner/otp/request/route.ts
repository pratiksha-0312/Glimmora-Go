import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueOtp } from "@/lib/partnerAuth";

const schema = z.object({
  phone: z.string().regex(/^\d{10}$/, "10-digit phone required"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  const { phone } = parsed.data;

  // Only issue OTP if a partner with this phone exists
  const partner = await prisma.partner.findUnique({ where: { phone } });
  if (!partner) {
    return NextResponse.json(
      { error: "No partner found. Sign up first." },
      { status: 404 }
    );
  }

  const { code, expiresAt } = await issueOtp(phone, "PARTNER_LOGIN");
  // Dev-only: return the code so you can test without SMS. Remove in prod.
  return NextResponse.json({
    ok: true,
    expiresAt,
    ...(process.env.NODE_ENV === "production" ? {} : { devCode: code }),
  });
}
