import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "sos")) {
    return NextResponse.json({ count: 0 });
  }

  const cityFilter = session.cityId ? { cityId: session.cityId } : {};
  const count = await prisma.ride.count({
    where: {
      ...cityFilter,
      sosTriggered: true,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
  });
  return NextResponse.json({ count });
}
