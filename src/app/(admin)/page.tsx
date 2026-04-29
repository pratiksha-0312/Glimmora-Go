import { prisma } from "@/lib/db";
import { StatCard } from "@/components/ui/StatCard";
import {
  Car,
  Users,
  Banknote,
  AlertTriangle,
  UserPlus,
  Share2,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { requireAccess } from "@/lib/auth";
import { canFeature } from "@/lib/rbac";
import { LiveRides } from "./LiveRides";
import { RevenueChart } from "./RevenueChart";
import { RecentRidesTable } from "./RecentRidesTable";
import type { RideStatus } from "../../../generated/prisma";

export const dynamic = "force-dynamic";

const IN_FLIGHT: RideStatus[] = ["REQUESTED", "MATCHED", "EN_ROUTE", "ARRIVED", "IN_TRIP"];

async function getStats(cityId: string | null) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const cityFilter = cityId ? { cityId } : {};

  const [
    ridesToday,
    ridesYesterday,
    completedToday,
    activeDriverCount,
    sosCount,
    liveRides,
    activeDrivers,
    sosFeed,
    scheduled,
    completedYesterday,
    weeklyCompleted,
    newSignups,
    referralSignups,
    recentRides,
    allCities,
  ] = await Promise.all([
    prisma.ride.count({
      where: { ...cityFilter, createdAt: { gte: startOfToday } },
    }),
    prisma.ride.count({
      where: { ...cityFilter, createdAt: { gte: startOfYesterday, lt: startOfToday } },
    }),
    prisma.ride.findMany({
      where: { ...cityFilter, completedAt: { gte: startOfToday }, status: "COMPLETED" },
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
        id: true, status: true, pickupAddress: true, dropAddress: true,
        fareEstimate: true, sosTriggered: true, createdAt: true,
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
        id: true, name: true, phone: true, updatedAt: true,
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
        id: true, status: true, createdAt: true,
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
        id: true, status: true, pickupAddress: true, dropAddress: true,
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
    // Weekly revenue (last 7 days)
    prisma.ride.findMany({
      where: {
        ...cityFilter,
        completedAt: { gte: sevenDaysAgo },
        status: "COMPLETED",
      },
      select: { fareFinal: true, completedAt: true },
    }),
    // New rider signups today
    prisma.rider.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    // Referral signups today
    prisma.referral.count({
      where: { refereeJoined: true, createdAt: { gte: startOfToday } },
    }),
    // Recent rides (all statuses) for the table
    prisma.ride.findMany({
      where: { ...cityFilter },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, status: true, pickupAddress: true, dropAddress: true,
        fareEstimate: true, fareFinal: true, createdAt: true, completedAt: true,
        rider: { select: { phone: true, name: true } },
        driver: { select: { name: true } },
        city: { select: { name: true } },
      },
    }),
    // Distinct cities for filter dropdown
    prisma.city.findMany({
      where: { active: true },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const revenueToday = completedToday.reduce((s, r) => s + (r.fareFinal ?? 0), 0);

  const todayHourly = Array(24).fill(0) as number[];
  for (const r of completedToday) {
    if (!r.completedAt) continue;
    todayHourly[new Date(r.completedAt).getHours()] += r.fareFinal ?? 0;
  }

  const revenueYesterday = completedYesterday.reduce((s, r) => s + (r.fareFinal ?? 0), 0);
  const yesterdayHourly = Array(24).fill(0) as number[];
  for (const r of completedYesterday) {
    if (!r.completedAt) continue;
    yesterdayHourly[new Date(r.completedAt).getHours()] += r.fareFinal ?? 0;
  }

  // Build weekly arrays
  const weeklyRevenue = Array(7).fill(0) as number[];
  const weeklyRideCount = Array(7).fill(0) as number[];
  for (const r of weeklyCompleted) {
    if (!r.completedAt) continue;
    const idx = Math.floor(
      (new Date(r.completedAt).getTime() - sevenDaysAgo.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (idx >= 0 && idx < 7) {
      weeklyRevenue[idx] += r.fareFinal ?? 0;
      weeklyRideCount[idx]++;
    }
  }

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    return DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
  });
  const weeklyDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  });

  const totalWeeklyRevenue = weeklyRevenue.reduce((a, b) => a + b, 0);
  const totalWeeklyRides = weeklyRideCount.reduce((a, b) => a + b, 0);
  const prevWeekRevenue = revenueYesterday * 7; // approximation
  const weeklyDelta =
    prevWeekRevenue > 0
      ? Math.round(((totalWeeklyRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
      : null;

  return {
    ridesToday,
    ridesYesterday,
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
    weeklyRevenue,
    weeklyLabels,
    weeklyDates,
    totalWeeklyRides,
    weeklyDelta,
    newSignups,
    referralSignups,
    recentRides,
    cityNames: allCities.map((c) => c.name),
  };
}

export default async function DashboardPage() {
  const session = await requireAccess("dashboard");

  type Stats = Awaited<ReturnType<typeof getStats>>;
  let data: Stats = {
    ridesToday: 0, ridesYesterday: 0,
    revenueToday: 0, revenueYesterday: 0,
    activeDriverCount: 0, activeDrivers: [],
    sosCount: 0, liveRides: [], sosFeed: [], scheduled: [],
    todayHourly: Array(24).fill(0) as number[],
    yesterdayHourly: Array(24).fill(0) as number[],
    weeklyRevenue: Array(7).fill(0) as number[],
    weeklyLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    weeklyDates: ["", "", "", "", "", "", ""],
    totalWeeklyRides: 0, weeklyDelta: null,
    newSignups: 0, referralSignups: 0,
    recentRides: [], cityNames: [],
  };
  let dbError = false;
  try {
    data = await getStats(session.cityId);
  } catch {
    dbError = true;
  }

  const showLiveRides = canFeature(session.role, "dashboard.live_rides");
  const showRevenue = canFeature(session.role, "dashboard.revenue_snapshot");

  const ridesDelta =
    data.ridesYesterday > 0
      ? Math.round(((data.ridesToday - data.ridesYesterday) / data.ridesYesterday) * 100)
      : null;

  const revenueDelta =
    data.revenueYesterday > 0
      ? Math.round(
          ((data.revenueToday - data.revenueYesterday) / data.revenueYesterday) * 100
        )
      : null;

  // Derive AI insights from data
  const peakHour = data.todayHourly.indexOf(Math.max(...data.todayHourly));
  const cityCounts: Record<string, number> = {};
  for (const r of data.recentRides) {
    cityCounts[r.city.name] = (cityCounts[r.city.name] ?? 0) + 1;
  }
  const topCity = Object.entries(cityCounts).sort(([, a], [, b]) => b - a)[0];

  const insights: { type: "positive" | "negative" | "info" | "warning"; title: string; detail: string }[] = [];
  if (revenueDelta !== null) {
    insights.push(
      revenueDelta >= 0
        ? { type: "positive", title: `Revenue is up ${revenueDelta}% today`, detail: "Good job! Your revenue is performing well." }
        : { type: "negative", title: `Revenue is down ${Math.abs(revenueDelta)}% today`, detail: "Consider reviewing driver availability and pricing." }
    );
  }
  if (data.todayHourly[peakHour] > 0) {
    insights.push({
      type: "info",
      title: `Peak hour: ${peakHour}:00 – ${peakHour + 1}:00`,
      detail: "Most rides are booked during peak hours.",
    });
  }
  if (topCity) {
    insights.push({
      type: "warning",
      title: `${topCity[0]} has highest demand`,
      detail: "Consider increasing driver availability.",
    });
  }
  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "Revenue insights will appear here",
      detail: "Complete more rides to generate AI-powered insights.",
    });
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of today&apos;s rides, revenue, and live operations
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="font-medium text-green-600">Live</span>
          <span className="text-slate-300">·</span>
          <span>Last updated: just now</span>
          <RefreshCw className="h-3 w-3 text-slate-400" />
        </div>
      </div>

      {dbError && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Database not reachable. Showing empty values. Run{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">npm run db:push</code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">npm run db:seed</code>{" "}
          once your Postgres is running.
        </div>
      )}

      {/* Row 1 – KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rides Today"
          value={data.ridesToday}
          icon={Car}
          trend="vs yesterday"
          accent="brand"
          sparkline={data.todayHourly}
          percentChange={ridesDelta}
        />
        <StatCard
          label="Revenue Today"
          value={formatCurrency(data.revenueToday)}
          icon={Banknote}
          trend="vs yesterday"
          accent="green"
          sparkline={data.todayHourly}
          percentChange={revenueDelta}
        />
        <StatCard
          label="Active Drivers"
          value={data.activeDriverCount}
          icon={Users}
          trend="Currently online"
          accent="blue"
          sparkline={data.todayHourly.map((_, i) => (i < 12 ? data.activeDriverCount : 0))}
        />
        <StatCard
          label="SOS Alerts"
          value={data.sosCount}
          icon={AlertTriangle}
          trend={data.sosCount === 0 ? "No active alerts" : "Active emergencies"}
          accent="red"
          sparkline={Array(24).fill(0).map((_, i) => (i % 5 === 0 ? data.sosCount : 0))}
        />
      </div>

      {/* Row 2 – Live Metric Cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: UserPlus,
            value: data.newSignups,
            label: "New Signups",
            sub: "Riders registered today",
            bg: "bg-violet-50",
            text: "text-violet-600",
          },
          {
            icon: AlertTriangle,
            value: data.sosCount,
            label: "SOS Alerts",
            sub: "Active emergencies today",
            bg: "bg-orange-50",
            text: "text-orange-500",
          },
          {
            icon: Car,
            value: data.activeDriverCount,
            label: "Drivers Online",
            sub: "Currently active",
            bg: "bg-orange-50",
            text: "text-orange-500",
          },
          {
            icon: Share2,
            value: data.referralSignups,
            label: "Referral Signups",
            sub: "Via referral links today",
            bg: "bg-teal-50",
            text: "text-teal-600",
          },
        ].map(({ icon: Icon, value, label, sub, bg, text }) => (
          <div
            key={label}
            className="relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Live
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${text}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-700">{label}</div>
            <div className="mt-0.5 text-xs text-slate-400">{sub}</div>
          </div>
        ))}

      </div>

      {/* Row 3 – Revenue Chart */}
      <div className="mt-6">
        {showRevenue ? (
          <RevenueChart
            todayHourly={data.todayHourly}
            weeklyRevenue={data.weeklyRevenue}
            weeklyLabels={data.weeklyLabels}
            weeklyDates={data.weeklyDates}
            weeklyRideCount={data.totalWeeklyRides}
            weeklyDelta={data.weeklyDelta}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-slate-100 bg-white p-10 text-sm text-slate-400 shadow-sm">
            Revenue data not available for your role
          </div>
        )}
      </div>

      {/* Row 4 – Recent Rides Table */}
      <div className="mt-6">
        <RecentRidesTable
          initial={data.recentRides.map((r) => ({
            ...r,
            createdAt: r.createdAt.toString(),
            completedAt: r.completedAt?.toString() ?? null,
          }))}
          cities={data.cityNames}
        />
      </div>

      {/* Hidden LiveRides (keeps live-polling alive for active rides) */}
      {showLiveRides && (
        <div className="hidden">
          <LiveRides initial={data.liveRides.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
        </div>
      )}
    </div>
  );
}
