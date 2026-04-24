import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite } from "@/lib/apiAuth";

const schema = z.object({
  matchingRadiusKm: z.number().min(0.1),
  surgeMultiplier: z.number().min(1),
  paymentOptions: z.array(z.enum(["CASH", "UPI", "CARD"])).min(1),
  baseFare: z.number().min(0),
  perKm: z.number().min(0),
  perMin: z.number().min(0),
  minimumFare: z.number().min(0),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ archetype: string }> }
) {
  const auth = await requireWrite("cities");
  if (!auth.ok) return auth.response;

  const { archetype } = await params;
  if (archetype !== "METRO" && archetype !== "SMALL_TOWN") {
    return NextResponse.json({ error: "Invalid archetype" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const defaults = await prisma.archetypeDefaults.upsert({
    where: { archetype },
    create: { archetype, ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json({ ok: true, defaults });
}
