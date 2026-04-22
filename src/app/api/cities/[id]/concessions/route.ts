import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  womenMultiplier: z.number().min(0.1).max(1),
  seniorMultiplier: z.number().min(0.1).max(1),
  childrenMultiplier: z.number().min(0.1).max(1),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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
