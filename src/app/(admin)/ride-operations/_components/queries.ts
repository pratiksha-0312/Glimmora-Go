import { prisma } from "@/lib/db";
import { RideStatus } from "../../../../../generated/prisma";

export const LIVE_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.EN_ROUTE,
  RideStatus.ARRIVED,
  RideStatus.IN_TRIP,
];

export const HISTORY_STATUSES: RideStatus[] = [
  RideStatus.COMPLETED,
  RideStatus.CANCELLED,
];

const RIDE_INCLUDE = {
  rider: { select: { name: true, phone: true } },
  driver: { select: { name: true, phone: true } },
  city: { select: { name: true } },
} as const;

export type RideStats = {
  total: number;
  totalDelta: number | null;
  live: number;
  completed: number;
  completedDelta: number | null;
  scheduled: number;
  cancelled: number;
  cancelledDelta: number | null;
  history: number;
};

export async function fetchRideStats(cityId: string | null): Promise<RideStats> {
  const cityFilter = cityId ? { cityId } : {};
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  try {
    const [
      total, live, completed, scheduled, cancelled, history,
      totalToday, totalYesterday,
      completedToday, completedYesterday,
      cancelledToday, cancelledYesterday,
    ] = await Promise.all([
      prisma.ride.count({ where: cityFilter }),
      prisma.ride.count({ where: { ...cityFilter, status: { in: LIVE_STATUSES } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.COMPLETED } }),
      prisma.ride.count({ where: { ...cityFilter, scheduledAt: { gt: new Date() }, status: { in: [RideStatus.REQUESTED, RideStatus.MATCHED] } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.CANCELLED } }),
      prisma.ride.count({ where: { ...cityFilter, status: { in: HISTORY_STATUSES } } }),
      prisma.ride.count({ where: { ...cityFilter, createdAt: { gte: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.COMPLETED, createdAt: { gte: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.COMPLETED, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.CANCELLED, createdAt: { gte: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.CANCELLED, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    ]);

    const pct = (a: number, b: number) =>
      b === 0 ? null : Math.round(((a - b) / b) * 1000) / 10;

    return {
      total,
      totalDelta: pct(totalToday, totalYesterday),
      live,
      completed,
      completedDelta: pct(completedToday, completedYesterday),
      scheduled,
      cancelled,
      cancelledDelta: pct(cancelledToday, cancelledYesterday),
      history,
    };
  } catch {
    return { total: 0, totalDelta: null, live: 0, completed: 0, completedDelta: null, scheduled: 0, cancelled: 0, cancelledDelta: null, history: 0 };
  }
}

export async function fetchRides({
  cityId,
  where,
  orderBy = { createdAt: "desc" as const },
  take = 100,
  skip = 0,
  search,
}: {
  cityId: string | null;
  where: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc">;
  take?: number;
  skip?: number;
  search?: string;
}) {
  const cityFilter = cityId ? { cityId } : {};

  const searchFilter: Record<string, unknown> = search
    ? {
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { rider: { name: { contains: search, mode: "insensitive" } } },
          { rider: { phone: { contains: search } } },
          { driver: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};

  try {
    const [rides, total, approvedDrivers] = await Promise.all([
      prisma.ride.findMany({
        where: { ...cityFilter, ...where, ...searchFilter },
        orderBy,
        take,
        skip,
        include: RIDE_INCLUDE,
      }),
      prisma.ride.count({
        where: { ...cityFilter, ...where, ...searchFilter },
      }),
      prisma.driver.findMany({
        where: { ...cityFilter, status: "APPROVED" },
        select: { id: true, name: true, phone: true, cityId: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { rides, total, approvedDrivers };
  } catch {
    return { rides: [], total: 0, approvedDrivers: [] };
  }
}

export type LiveStats = {
  requested: number;
  inTrip: number;
  completedToday: number;
  completedDelta: number | null;
  cancelledToday: number;
  cancelledDelta: number | null;
};

export async function fetchLiveStats(cityId: string | null): Promise<LiveStats> {
  const cityFilter = cityId ? { cityId } : {};
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  try {
    const [
      requested, inTrip,
      completedToday, completedYesterday,
      cancelledToday, cancelledYesterday,
    ] = await Promise.all([
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.REQUESTED } }),
      prisma.ride.count({ where: { ...cityFilter, status: { in: [RideStatus.MATCHED, RideStatus.EN_ROUTE, RideStatus.ARRIVED, RideStatus.IN_TRIP] } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.COMPLETED, createdAt: { gte: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.COMPLETED, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.CANCELLED, createdAt: { gte: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.CANCELLED, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    ]);

    const pct = (a: number, b: number) =>
      b === 0 ? null : Math.round(((a - b) / b) * 1000) / 10;

    return {
      requested,
      inTrip,
      completedToday,
      completedDelta: pct(completedToday, completedYesterday),
      cancelledToday,
      cancelledDelta: pct(cancelledToday, cancelledYesterday),
    };
  } catch {
    return { requested: 0, inTrip: 0, completedToday: 0, completedDelta: null, cancelledToday: 0, cancelledDelta: null };
  }
}

export async function fetchCities(cityId: string | null) {
  try {
    const where = cityId ? { id: cityId } : {};
    return await prisma.city.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export type HistoryStats = {
  completed: number;
  completedDelta: number | null;
  cancelled: number;
  cancelledDelta: number | null;
  totalRevenue: number;
  revenueDelta: number | null;
  avgFare: number | null;
  avgDurationMin: number | null;
};

export async function fetchHistoryStats(
  cityId: string | null,
  dateWhere: Record<string, unknown> = {}
): Promise<HistoryStats> {
  const cityFilter = cityId ? { cityId } : {};
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  try {
    const baseWhere = { ...cityFilter, ...dateWhere };
    const [
      completed, cancelled,
      completedToday, completedYesterday,
      cancelledToday, cancelledYesterday,
      revenueAgg, revenueTodayAgg, revenueYestAgg,
      avgAgg,
    ] = await Promise.all([
      prisma.ride.count({ where: { ...baseWhere, status: RideStatus.COMPLETED } }),
      prisma.ride.count({ where: { ...baseWhere, status: RideStatus.CANCELLED } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.COMPLETED, createdAt: { gte: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.COMPLETED, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.CANCELLED, createdAt: { gte: todayStart } } }),
      prisma.ride.count({ where: { ...cityFilter, status: RideStatus.CANCELLED, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.ride.aggregate({ where: { ...baseWhere, status: RideStatus.COMPLETED }, _sum: { fareFinal: true } }),
      prisma.ride.aggregate({ where: { ...cityFilter, status: RideStatus.COMPLETED, createdAt: { gte: todayStart } }, _sum: { fareFinal: true } }),
      prisma.ride.aggregate({ where: { ...cityFilter, status: RideStatus.COMPLETED, createdAt: { gte: yesterdayStart, lt: todayStart } }, _sum: { fareFinal: true } }),
      prisma.ride.aggregate({ where: { ...baseWhere, status: RideStatus.COMPLETED }, _avg: { fareFinal: true, durationMin: true } }),
    ]);

    const pct = (a: number, b: number) =>
      b === 0 ? null : Math.round(((a - b) / b) * 1000) / 10;

    return {
      completed,
      completedDelta: pct(completedToday, completedYesterday),
      cancelled,
      cancelledDelta: pct(cancelledToday, cancelledYesterday),
      totalRevenue: revenueAgg._sum.fareFinal ?? 0,
      revenueDelta: pct(revenueTodayAgg._sum.fareFinal ?? 0, revenueYestAgg._sum.fareFinal ?? 0),
      avgFare: avgAgg._avg.fareFinal,
      avgDurationMin: avgAgg._avg.durationMin,
    };
  } catch {
    return { completed: 0, completedDelta: null, cancelled: 0, cancelledDelta: null, totalRevenue: 0, revenueDelta: null, avgFare: null, avgDurationMin: null };
  }
}
