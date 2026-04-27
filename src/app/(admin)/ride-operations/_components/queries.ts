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

export async function fetchRides({
  cityId,
  where,
  orderBy = { createdAt: "desc" as const },
  take = 100,
}: {
  cityId: string | null;
  where: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc">;
  take?: number;
}) {
  const cityFilter = cityId ? { cityId } : {};
  try {
    const [rides, approvedDrivers] = await Promise.all([
      prisma.ride.findMany({
        where: { ...cityFilter, ...where },
        orderBy,
        take,
        include: RIDE_INCLUDE,
      }),
      prisma.driver.findMany({
        where: { ...cityFilter, status: "APPROVED" },
        select: { id: true, name: true, phone: true, cityId: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { rides, approvedDrivers };
  } catch {
    return { rides: [], approvedDrivers: [] };
  }
}
