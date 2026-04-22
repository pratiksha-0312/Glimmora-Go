import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  code: z.string().min(3).max(32),
  description: z.string().optional(),
  discountType: z.enum(["FLAT", "PERCENT"]),
  amount: z.number().min(0),
  usageLimit: z.number().nullable().optional(),
  validUntil: z.string().datetime(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
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
    return NextResponse.json({ ok: true, coupon });
  } catch (err) {
    return NextResponse.json(
      { error: "Code already exists" },
      { status: 409 }
    );
  }
}
