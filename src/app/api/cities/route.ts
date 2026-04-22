import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  archetype: z.enum(["METRO", "SMALL_TOWN"]),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, state, archetype } = parsed.data;
  const defaults = archetype === "METRO"
    ? { matchingRadiusKm: 3, surgeMultiplier: 1.2, paymentOptions: ["CASH", "UPI", "CARD"] }
    : { matchingRadiusKm: 7, surgeMultiplier: 1.0, paymentOptions: ["CASH", "UPI"] };

  try {
    const city = await prisma.city.create({
      data: {
        name,
        state,
        archetype,
        ...defaults,
        fareConfig: { create: {} },
      },
    });
    return NextResponse.json({ ok: true, city });
  } catch {
    return NextResponse.json(
      { error: "City already exists" },
      { status: 409 }
    );
  }
}
