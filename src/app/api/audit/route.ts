import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRead } from "@/lib/apiAuth";

export async function GET(req: Request) {
  const auth = await requireRead("audit");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const adminId = url.searchParams.get("adminId");
  const action = url.searchParams.get("action");
  const since = url.searchParams.get("since");
  const take = Math.min(Number(url.searchParams.get("limit") ?? 200), 1000);

  const events = await prisma.auditEvent.findMany({
    where: {
      ...(entityType ? { entityType } : {}),
      ...(adminId ? { adminId } : {}),
      ...(action ? { action } : {}),
      ...(since ? { createdAt: { gte: new Date(since) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({ events });
}
