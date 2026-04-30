import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { AutoRefresh } from "../_components/AutoRefresh";
import { RidesTable } from "../_components/RidesTable";
import { RideOpsTabs } from "../_components/RideOpsTabs";
import { LiveFiltersBar } from "../_components/LiveFiltersBar";
import { fetchRides, fetchLiveStats, fetchCities, LIVE_STATUSES } from "../_components/queries";
import type { RideStatus } from "../../../../../generated/prisma";
import { Clock, Activity, CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function LiveStatCard({
  icon,
  iconBg,
  label,
  value,
  subtitle,
  subtitleColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  subtitle: React.ReactNode;
  subtitleColor: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-4 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500 dark:text-[#6b7280]">{label}</div>
        <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-[#f9fafb]">
          {value.toLocaleString("en-IN")}
        </div>
        <div className={`mt-0.5 text-[11px] font-medium ${subtitleColor}`}>{subtitle}</div>
      </div>
    </div>
  );
}

export default async function LiveRidesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    date?: string;
    status?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  const session = await requireAccess("rides");
  const sp = await searchParams;
  const canWrite = sessionCanWrite(session, "rides");

  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = Math.min(100, Math.max(5, parseInt(sp.perPage ?? "10", 10)));
  const skip = (page - 1) * perPage;
  const search = sp.search?.trim() || undefined;

  const statusWhere =
    sp.status && sp.status !== ""
      ? { status: sp.status as RideStatus }
      : { status: { in: LIVE_STATUSES } };

  const where: Record<string, unknown> = { ...statusWhere };
  if (sp.date) {
    const from = new Date(sp.date);
    const to = new Date(sp.date + "T23:59:59");
    where.createdAt = { gte: from, lte: to };
  }

  const [{ rides, total, approvedDrivers }, stats, cities] = await Promise.all([
    fetchRides({ cityId: session.cityId, where, take: perPage, skip, search }),
    fetchLiveStats(session.cityId),
    fetchCities(session.cityId),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#555]">
            <span>Ride Operations</span>
            <span>›</span>
            <span className="text-slate-600 dark:text-[#9ca3af]">Live Rides</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f9fafb]">Live Rides</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-[#6b7280]">
            Monitor rides currently in flight (REQUESTED → IN_TRIP)
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <AutoRefresh />
        </div>
      </div>

      {/* ── Tabs ── */}
      <RideOpsTabs active="live" />

      {/* ── Stats cards ── */}
      <div className="flex flex-wrap gap-3">
        <LiveStatCard
          icon={<Clock className="h-5 w-5 text-orange-500" />}
          iconBg="bg-orange-100 dark:bg-orange-500/10"
          label="Requested"
          value={stats.requested}
          subtitle={
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              {stats.requested} Requested
            </span>
          }
          subtitleColor="text-orange-500"
        />
        <LiveStatCard
          icon={<Activity className="h-5 w-5 text-purple-500" />}
          iconBg="bg-purple-100 dark:bg-purple-500/10"
          label="In Trip"
          value={stats.inTrip}
          subtitle={
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              {stats.inTrip} In Trip
            </span>
          }
          subtitleColor="text-purple-500"
        />
        <LiveStatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          iconBg="bg-green-100 dark:bg-green-500/10"
          label="Completed Today"
          value={stats.completedToday}
          subtitle={
            stats.completedDelta !== null ? (
              <span>
                {stats.completedDelta >= 0 ? "↑" : "↓"} {Math.abs(stats.completedDelta)}% vs yesterday
              </span>
            ) : "—"
          }
          subtitleColor={
            stats.completedDelta !== null && stats.completedDelta >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-500 dark:text-red-400"
          }
        />
        <LiveStatCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-100 dark:bg-red-500/10"
          label="Cancelled Today"
          value={stats.cancelledToday}
          subtitle={
            stats.cancelledDelta !== null ? (
              <span>
                {stats.cancelledDelta >= 0 ? "↑" : "↓"} {Math.abs(stats.cancelledDelta)}% vs yesterday
              </span>
            ) : "—"
          }
          subtitleColor={
            stats.cancelledDelta !== null && stats.cancelledDelta < 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-500 dark:text-red-400"
          }
        />
      </div>

      {/* ── Filter bar ── */}
      <LiveFiltersBar
        cities={cities}
        initialSearch={search}
        initialDate={sp.date}
        initialStatus={sp.status}
      />

      {/* ── Table ── */}
      <RidesTable
        rides={rides}
        approvedDrivers={approvedDrivers}
        canWrite={canWrite}
        emptyMessage="No rides currently in flight"
        total={total}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        paginationBasePath="/ride-operations/live"
        paginationLabel="live rides"
      />
    </div>
  );
}
