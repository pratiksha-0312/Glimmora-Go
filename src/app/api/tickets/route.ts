import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRead, requireWrite } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  category: z.enum([
    "RIDE_ISSUE",
    "SAFETY",
    "PAYMENT",
    "DRIVER_BEHAVIOR",
    "APP",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  subject: z.string().min(3).max(200),
  description: z.string().min(3).max(4000),
  riderId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  rideId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const auth = await requireRead("tickets");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q")?.trim();
  const take = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

  const where = {
    ...(auth.session.cityId ? { cityId: auth.session.cityId } : {}),
    ...(status ? { status: status as never } : {}),
    ...(category ? { category: category as never } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take,
    include: {
      rider: { select: { id: true, phone: true, name: true } },
      driver: { select: { id: true, phone: true, name: true } },
      ride: { select: { id: true, pickupAddress: true, dropAddress: true } },
      city: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const auth = await requireWrite("tickets");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  let cityId = data.cityId ?? null;
  if (!cityId && data.rideId) {
    const ride = await prisma.ride.findUnique({
      where: { id: data.rideId },
      select: { cityId: true },
    });
    cityId = ride?.cityId ?? null;
  }
  if (auth.session.cityId && cityId && cityId !== auth.session.cityId) {
    return NextResponse.json(
      { error: "Forbidden: out of city scope" },
      { status: 403 }
    );
  }

  const ticket = await prisma.ticket.create({
    data: {
      category: data.category,
      priority: data.priority ?? "NORMAL",
      subject: data.subject,
      description: data.description,
      riderId: data.riderId ?? null,
      driverId: data.driverId ?? null,
      rideId: data.rideId ?? null,
      cityId,
    },
  });

  await logAudit({
    session: auth.session,
    action: "ticket.create",
    entityType: "Ticket",
    entityId: ticket.id,
    summary: `${ticket.category} — ${ticket.subject}`,
  });

  return NextResponse.json({ ok: true, ticket });
}
