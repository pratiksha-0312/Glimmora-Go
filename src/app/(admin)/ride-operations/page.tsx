import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { RidesTable } from "./_components/RidesTable";
import { RideOpsTabs } from "./_components/RideOpsTabs";
import { RideFiltersBar } from "./_components/RideFiltersBar";
import { fetchRides, fetchRideStats, fetchCities } from "./_components/queries";
import type { RideStatus } from "../../../../generated/prisma";
import { Car, Activity, CheckCircle2, Clock, XCircle } from "lucide-react";
import { ExportDropdown } from "./_components/ExportDropdown";

export const dynamic = "force-dynamic";

const STATUS_PILLS = [
  { value: "ALL",       label: "All Statuses", pill: "border border-orange-400 bg-orange-50 text-orange-500",      dot: "" },
  { value: "REQUESTED", label: "Requested",    pill: "bg-orange-50 text-orange-600",   dot: "bg-orange-400" },
  { value: "MATCHED",   label: "Matched",      pill: "bg-blue-50 text-blue-600",       dot: "bg-blue-400" },
  { value: "IN_TRIP",   label: "In Trip",      pill: "bg-purple-50 text-purple-600",   dot: "bg-purple-500" },
  { value: "COMPLETED", label: "Completed",    pill: "bg-green-50 text-green-700",     dot: "bg-green-500" },
  { value: "CANCELLED", label: "Cancelled",    pill: "bg-red-50 text-red-600",         dot: "bg-red-500" },
] as const;

function StatCard({
  icon,
  label,
  value,
  delta,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delta: number | null;
  iconBg: string;
}) {
  return (
    <div className="flex min-w-[160px] flex-1 items-center gap-4 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500 dark:text-[#6b7280]">{label}</div>
        <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-[#f9fafb]">
          {value.toLocaleString("en-IN")}
        </div>
        {delta !== null && (
          <span
            className={`mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              delta >= 0
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs yesterday
          </span>
        )}
      </div>
    </div>
  );
}

export default async function AllRidesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
    perPage?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const session = await requireAccess("rides");
  const sp = await searchParams;
  const canWrite = sessionCanWrite(session, "rides");

  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = Math.min(100, Math.max(5, parseInt(sp.perPage ?? "10", 10)));
  const skip = (page - 1) * perPage;
  const search = sp.search?.trim() || undefined;

  const where: Record<string, unknown> = {};
  if (sp.status && sp.status !== "ALL") where.status = sp.status as RideStatus;
  if (sp.dateFrom || sp.dateTo) {
    where.createdAt = {
      ...(sp.dateFrom ? { gte: new Date(sp.dateFrom) } : {}),
      ...(sp.dateTo ? { lte: new Date(sp.dateTo + "T23:59:59") } : {}),
    };
  }

  const [{ rides, total, approvedDrivers }, stats, cities] = await Promise.all([
    fetchRides({ cityId: session.cityId, where, take: perPage, skip, search }),
    fetchRideStats(session.cityId),
    fetchCities(session.cityId),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const activeStatus = sp.status ?? "ALL";

  return (
    <div className="space-y-5 pb-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#555]">
            <span>Ride Operations</span>
            <span>›</span>
            <span className="text-slate-600 dark:text-[#9ca3af]">All Rides</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f9fafb]">Rides</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-[#6b7280]">
            Manage and monitor all rides across the platform
          </p>
        </div>
        <ExportDropdown
          exportUrl={`/api/rides/export?${new URLSearchParams({
            ...(sp.status && sp.status !== "ALL" ? { status: sp.status } : {}),
            ...(search ? { search } : {}),
            ...(sp.dateFrom ? { dateFrom: sp.dateFrom } : {}),
            ...(sp.dateTo ? { dateTo: sp.dateTo } : {}),
          }).toString()}`}
        />
      </div>

      {/* ── Tabs ── */}
      <RideOpsTabs
        active="all"
        counts={{
          all: stats.total,
          live: stats.live,
          scheduled: stats.scheduled,
          history: stats.history,
        }}
      />

      {/* ── Stats cards ── */}
      <div className="flex flex-wrap gap-3">
        <StatCard
          icon={<Car className="h-5 w-5 text-orange-500" />}
          label="Total Rides"
          value={stats.total}
          delta={stats.totalDelta}
          iconBg="bg-orange-100 dark:bg-orange-500/10"
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-blue-500" />}
          label="Live Rides"
          value={stats.live}
          delta={null}
          iconBg="bg-blue-100 dark:bg-blue-500/10"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label="Completed"
          value={stats.completed}
          delta={stats.completedDelta}
          iconBg="bg-green-100 dark:bg-green-500/10"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label="Scheduled"
          value={stats.scheduled}
          delta={null}
          iconBg="bg-amber-100 dark:bg-amber-500/10"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          label="Cancelled"
          value={stats.cancelled}
          delta={stats.cancelledDelta}
          iconBg="bg-red-100 dark:bg-red-500/10"
        />
      </div>

      {/* ── Filter bar ── */}
      <RideFiltersBar
        cities={cities}
        initialSearch={search}
        initialStatus={sp.status}
      />

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_PILLS.map((f) => {
          const isActive = activeStatus === f.value;
          const href =
            f.value === "ALL"
              ? "/ride-operations"
              : `/ride-operations?status=${f.value}`;
          return (
            <a
              key={f.value}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${f.pill} ${
                isActive ? "ring-1 ring-current" : "opacity-75 hover:opacity-100"
              }`}
            >
              {f.dot && <span className={`h-2 w-2 rounded-full ${f.dot}`} />}
              {f.label}
            </a>
          );
        })}
      </div>

      {/* ── Table ── */}
      <RidesTable
        rides={rides}
        approvedDrivers={approvedDrivers}
        canWrite={canWrite}
        emptyMessage="No rides found"
        total={total}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
      />
    </div>
  );
}
