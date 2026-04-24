import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, cityMismatch } from "@/lib/apiAuth";

const schema = z.object({
  baseFare: z.number().min(0),
  perKm: z.number().min(0),
  perMin: z.number().min(0),
  minimumFare: z.number().min(0),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWrite("fares");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const scope = cityMismatch(auth.session, id);
  if (scope) return scope;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const fare = await prisma.fareConfig.upsert({
    where: { cityId: id },
    create: { cityId: id, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ ok: true, fare });
}
