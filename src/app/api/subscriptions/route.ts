import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWrite, requireRead } from "@/lib/apiAuth";

const PLAN_DAYS: Record<"DAILY" | "WEEKLY" | "MONTHLY", number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
};

const PLAN_AMOUNTS: Record<"DAILY" | "WEEKLY" | "MONTHLY", number> = {
  DAILY: 30,
  WEEKLY: 150,
  MONTHLY: 500,
};

const createSchema = z.object({
  driverId: z.string().min(1),
  plan: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  amount: z.number().min(0).optional(),
});

export async function GET(req: Request) {
  const auth = await requireRead("subscriptions");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const driverId = url.searchParams.get("driverId");
  const activeOnly = url.searchParams.get("active") === "true";

  const now = new Date();
  const subscriptions = await prisma.subscription.findMany({
    where: {
      ...(driverId ? { driverId } : {}),
      ...(activeOnly ? { active: true, expiresAt: { gte: now } } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 200,
    include: {
      driver: {
        select: { id: true, name: true, phone: true, cityId: true },
      },
    },
  });
  return NextResponse.json({ subscriptions });
}

export async function POST(req: Request) {
  const auth = await requireWrite("subscriptions");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { driverId, plan } = parsed.data;
  const amount = parsed.data.amount ?? PLAN_AMOUNTS[plan];

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const now = new Date();
  const extendFrom =
    driver.subscriptionUntil && driver.subscriptionUntil > now
      ? driver.subscriptionUntil
      : now;
  const expiresAt = new Date(extendFrom);
  expiresAt.setDate(expiresAt.getDate() + PLAN_DAYS[plan]);

  const [subscription] = await prisma.$transaction([
    prisma.subscription.create({
      data: {
        driverId,
        plan,
        amount,
        startedAt: now,
        expiresAt,
        active: true,
      },
    }),
    prisma.driver.update({
      where: { id: driverId },
      data: { subscriptionUntil: expiresAt },
    }),
  ]);

  return NextResponse.json({ ok: true, subscription });
}
