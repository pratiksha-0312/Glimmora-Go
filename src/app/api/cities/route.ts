import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite } from "@/lib/apiAuth";

const schema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  archetype: z.enum(["METRO", "SMALL_TOWN"]),
});

export async function POST(req: Request) {
  const auth = await requireWrite("cities");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, state, archetype } = parsed.data;
  const defaults = await prisma.archetypeDefaults.findUnique({
    where: { archetype },
  });
  if (!defaults) {
    return NextResponse.json(
      { error: "Archetype defaults not configured" },
      { status: 500 }
    );
  }

  try {
    const city = await prisma.city.create({
      data: {
        name,
        state,
        archetype,
        matchingRadiusKm: defaults.matchingRadiusKm,
        surgeMultiplier: defaults.surgeMultiplier,
        paymentOptions: defaults.paymentOptions,
        fareConfig: {
          create: {
            baseFare: defaults.baseFare,
            perKm: defaults.perKm,
            perMin: defaults.perMin,
            minimumFare: defaults.minimumFare,
          },
        },
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
