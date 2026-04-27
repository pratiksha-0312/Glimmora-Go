import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite } from "@/lib/apiAuth";

const schema = z.object({
  code: z.string().min(3).max(32),
  description: z.string().optional(),
  discountType: z.enum(["FLAT", "PERCENT"]),
  amount: z.number().min(0),
  usageLimit: z.number().nullable().optional(),
  validUntil: z.string().datetime(),
});

export async function POST(req: Request) {
  const auth = await requireWrite("coupons");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const msg = first ? `${first.path.join(".")}: ${first.message}` : "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { code, description, discountType, amount, usageLimit, validUntil } =
    parsed.data;

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        description,
        discountType,
        amount,
        usageLimit: usageLimit ?? undefined,
        validUntil: new Date(validUntil),
      },
    });
    return NextResponse.json(coupon);
  } catch (err) {
    return NextResponse.json(
      { error: "Code already exists" },
      { status: 409 }
    );
  }
}
