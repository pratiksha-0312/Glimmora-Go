import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  phone: z.string().regex(/^\d{10}$/, "10-digit phone required"),
  shopName: z.string().min(2),
  ownerName: z.string().min(2),
  cityId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { phone, shopName, ownerName, cityId } = parsed.data;

  const existing = await prisma.kiranaPartner.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      { error: "Phone already registered" },
      { status: 409 }
    );
  }

  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }

  const partner = await prisma.kiranaPartner.create({
    data: { phone, shopName, ownerName, cityId },
    select: { id: true, shopName: true, status: true },
  });
  return NextResponse.json({ ok: true, partner });
}
