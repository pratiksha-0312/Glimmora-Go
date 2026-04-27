import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import {
  Car,
  Users,
  Banknote,
  AlertTriangle,
  Clock,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { requireAccess } from "@/lib/auth";
import { canFeature } from "@/lib/rbac";
import { LiveRides } from "./LiveRides";
import { RevenueChart } from "./RevenueChart";
import type { RideStatus } from "../../../generated/prisma";

export const dynamic = "force-dynamic";

const IN_FLIGHT: RideStatus[] = ["REQUESTED", "MATCHED", "EN_ROUTE", "ARRIVED", "IN_TRIP"];

async function getStats(cityId: string | null) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const cityFilter = cityId ? { cityId } : {};

  const [
    ridesToday,
    completedToday,
    activeDriverCount,
    sosCount,
    liveRides,
    activeDrivers,
    sosFeed,
    scheduled,
    completedYesterday,
  ] = await Promise.all([
    prisma.ride.count({
      where: { ...cityFilter, createdAt: { gte: startOfToday } },
    }),
    prisma.ride.findMany({
      where: {
        ...cityFilter,
        completedAt: { gte: startOfToday },
        status: "COMPLETED",
      },
      select: { fareFinal: true, completedAt: true },
    }),
    prisma.driver.count({
      where: { ...cityFilter, online: true, status: "APPROVED" },
    }),
    prisma.ride.count({
      where: {
        ...cityFilter,
        sosTriggered: true,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    prisma.ride.findMany({
      where: { ...cityFilter, status: { in: IN_FLIGHT } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        pickupAddress: true,
        dropAddress: true,
        fareEstimate: true,
        sosTriggered: true,
        createdAt: true,
        rider: { select: { phone: true, name: true } },
        driver: { select: { name: true } },
        city: { select: { name: true } },
      },
    }),
    prisma.driver.findMany({
      where: { ...cityFilter, online: true, status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        phone: true,
        updatedAt: true,
        city: { select: { name: true } },
        rides: {
          where: { status: { in: IN_FLIGHT } },
          select: { id: true, status: true },
          take: 1,
        },
      },
    }),
    prisma.ride.findMany({
      where: { ...cityFilter, sosTriggered: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        rider: { select: { phone: true, name: true } },
        city: { select: { name: true } },
      },
    }),
    prisma.ride.findMany({
      where: {
        ...cityFilter,
        scheduledAt: { gt: now },
        status: { in: ["REQUESTED", "MATCHED"] },
      },
      orderBy: { scheduledAt: "asc" },
      take: 8,
      select: {
        id: true,
        status: true,
        pickupAddress: true,
        dropAddress: true,
        scheduledAt: true,
        rider: { select: { phone: true, name: true } },
        city: { select: { name: true } },
      },
    }),
    prisma.ride.findMany({
      where: {
        ...cityFilter,
        completedAt: { gte: startOfYesterday, lt: startOfToday },
        status: "COMPLETED",
      },
      select: { fareFinal: true, completedAt: true },
    }),
  ]);

  const revenueToday = completedToday.reduce(
    (sum, r) => sum + (r.fareFinal ?? 0),
    0
  );

  const todayHourly = Array(24).fill(0) as number[];
  for (const r of completedToday) {
    if (!r.completedAt) continue;
    todayHourly[new Date(r.completedAt).getHours()] += r.fareFinal ?? 0;
  }

  const revenueYesterday = completedYesterday.reduce(
    (sum, r) => sum + (r.fareFinal ?? 0),
    0
  );
  const yesterdayHourly = Array(24).fill(0) as number[];
  for (const r of completedYesterday) {
    if (!r.completedAt) continue;
    yesterdayHourly[new Date(r.completedAt).getHours()] += r.fareFinal ?? 0;
  }

  return {
    ridesToday,
    revenueToday,
    revenueYesterday,
    activeDriverCount,
    activeDrivers: activeDrivers.map((d) => ({
      ...d,
      updatedAt: d.updatedAt.toISOString(),
    })),
    sosCount,
    liveRides: liveRides.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    sosFeed: sosFeed.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    scheduled: scheduled.map((r) => ({
      ...r,
      scheduledAt: r.scheduledAt!.toISOString(),
    })),
    todayHourly,
    yesterdayHourly,
  };
}

export default async function DashboardPage() {
  const session = await requireAccess("dashboard");

  type Stats = Awaited<ReturnType<typeof getStats>>;
  let data: Stats = {
    ridesToday: 0,
    revenueToday: 0,
    revenueYesterday: 0,
    activeDriverCount: 0,
    activeDrivers: [],
    sosCount: 0,
    liveRides: [],
    sosFeed: [],
    scheduled: [],
    todayHourly: Array(24).fill(0) as number[],
    yesterdayHourly: Array(24).fill(0) as number[],
  };
  let dbError = false;
  try {
    data = await getStats(session.cityId);
  } catch {
    dbError = true;
  }

  const showLiveRides = canFeature(session.role, "dashboard.live_rides");
  const showRevenue = canFeature(session.role, "dashboard.revenue_snapshot");
  const showActiveDrivers = canFeature(session.role, "dashboard.active_drivers");
  const showSosSummary = canFeature(session.role, "dashboard.sos_summary");
  const showScheduled = canFeature(session.role, "rides.scheduled");

  const revenueDelta =
    data.revenueYesterday > 0
      ? Math.round(
          ((data.revenueToday - data.revenueYesterday) / data.revenueYesterday) * 100
        )
      : null;

  return (
    <div>
      <PageHeader
        title="Operations"
        description="Live state of rides, drivers, alerts and revenue"
      />

      {dbError && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Database not reachable. Showing empty values. Run{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
            npm run db:push
          </code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
            npm run db:seed
          </code>{" "}
          once your Postgres is running.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rides Today"
          value={data.ridesToday}
          icon={Car}
          trend="Since 00:00"
          accent="brand"
        />
        <StatCard
          label="Revenue Today"
          value={formatCurrency(data.revenueToday)}
          icon={Banknote}
          trend="Completed rides only"
          accent="green"
        />
        <StatCard
          label="Active Drivers"
          value={data.activeDriverCount}
          icon={Users}
          trend="Currently online"
          accent="blue"
        />
        <StatCard
          label="SOS Alerts"
          value={data.sosCount}
          icon={AlertTriangle}
          trend="Today"
          accent="red"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {showLiveRides && <LiveRides initial={data.liveRides} />}

          {showScheduled && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Scheduled queue
                  </h2>
                  <Badge variant="default">{data.scheduled.length}</Badge>
                </div>
                <span className="text-[11px] text-slate-400">Next 8 upcoming</span>
              </div>
              {data.scheduled.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-10 text-center text-sm text-slate-400">
                  <CalendarClock className="h-7 w-7 text-slate-300" />
                  Nothing scheduled
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.scheduled.map((r) => {
                    const due = new Date(r.scheduledAt);
                    const mins = Math.round((due.getTime() - Date.now()) / 60000);
                    const startsIn =
                      mins < 60
                        ? `in ${mins}m`
                        : mins < 60 * 24
                          ? `in ${Math.round(mins / 60)}h`
                          : `in ${Math.round(mins / (60 * 24))}d`;
                    return (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                        <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {r.rider.name ?? r.rider.phone} · {r.city.name}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {r.pickupAddress} → {r.dropAddress}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-700">
                            {startsIn}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDate(r.scheduledAt)}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {showRevenue && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  Revenue snapshot
                </h2>
                <Link
                  href="/reports"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Reports →
                </Link>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Today
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(data.revenueToday)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Yesterday
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {formatCurrency(data.revenueYesterday)}
                    </div>
                    {revenueDelta !== null && (
                      <div
                        className={
                          "mt-0.5 inline-flex items-center gap-0.5 text-xs font-semibold " +
                          (revenueDelta > 0
                            ? "text-green-700"
                            : revenueDelta < 0
                              ? "text-red-700"
                              : "text-slate-500")
                        }
                      >
                        {revenueDelta > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : revenueDelta < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {Math.abs(revenueDelta)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <RevenueChart
                    todayHourly={data.todayHourly}
                    yesterdayHourly={data.yesterdayHourly}
                  />
                </div>
              </div>
            </div>
          )}

          {showActiveDrivers && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Users className="h-4 w-4 text-slate-500" />
                  Active drivers
                </h2>
                <Link
                  href="/drivers"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  All drivers →
                </Link>
              </div>
              {data.activeDrivers.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  No drivers currently online
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.activeDrivers.map((d) => {
                    const idleMin = Math.round(
                      (Date.now() - new Date(d.updatedAt).getTime()) / 60000
                    );
                    const onRide = d.rides[0];
                    const idle = !onRide && idleMin >= 30;
                    return (
                      <li key={d.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span
                          className={
                            "h-2 w-2 shrink-0 rounded-full " +
                            (onRide
                              ? "bg-blue-500"
                              : idle
                                ? "bg-amber-500"
                                : "bg-green-500")
                          }
                        />
                        <Link
                          href={`/drivers/${d.id}`}
                          className="min-w-0 flex-1 truncate text-sm text-slate-900 hover:text-brand-700"
                        >
                          <span className="font-medium">{d.name}</span>
                          <span className="ml-1 text-xs text-slate-500">
                            · {d.city?.name ?? "—"}
                          </span>
                        </Link>
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {onRide ? (
                            <Badge variant={rideStatusVariant(onRide.status)}>
                              {onRide.status}
                            </Badge>
                          ) : idle ? (
                            <span className="text-amber-700">idle {idleMin}m</span>
                          ) : (
                            <span className="text-green-700">available</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {showSosSummary && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  SOS feed
                </h2>
                <Link
                  href="/sos"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  All SOS →
                </Link>
              </div>
              {data.sosFeed.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  No SOS events
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.sosFeed.map((r) => {
                    const open = !["COMPLETED", "CANCELLED"].includes(r.status);
                    return (
                      <li
                        key={r.id}
                        className={"px-5 py-3 " + (open ? "bg-red-50/50" : "")}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">
                              {r.rider.name ?? r.rider.phone} · {r.city.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {formatDate(r.createdAt)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={open ? "danger" : "default"}>
                              {r.status}
                            </Badge>
                            <Link
                              href={`/rides?ride=${r.id}`}
                              className="text-[11px] font-medium text-brand-600 hover:text-brand-700"
                            >
                              Open
                            </Link>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
