import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRead } from "@/lib/apiAuth";

export async function GET(req: Request) {
  const auth = await requireRead("riders");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const take = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  const skip = Number(url.searchParams.get("offset") ?? 0);

  const where = q
    ? {
        OR: [
          { phone: { contains: q } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [riders, total] = await Promise.all([
    prisma.rider.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        phone: true,
        name: true,
        language: true,
        createdAt: true,
        _count: { select: { rides: true } },
      },
    }),
    prisma.rider.count({ where }),
  ]);

  return NextResponse.json({ riders, total, limit: take, offset: skip });
}
