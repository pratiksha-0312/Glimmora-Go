import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { RidesTable } from "../_components/RidesTable";
import { RideOpsTabs } from "../_components/RideOpsTabs";
import { HistoryFiltersBar } from "../_components/HistoryFiltersBar";
import { ExportDropdown } from "../_components/ExportDropdown";
import { fetchRides, fetchHistoryStats, fetchCities, HISTORY_STATUSES } from "../_components/queries";
import { formatCurrency } from "@/lib/utils";
import type { RideStatus } from "../../../../../generated/prisma";
import { CheckCircle2, XCircle, DollarSign, TrendingUp, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

function HistoryStatCard({
  icon,
  iconBg,
  label,
  value,
  delta,
  deltaPositiveIsGood = true,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  delta: number | null;
  deltaPositiveIsGood?: boolean;
}) {
  const isPositive = delta !== null && delta >= 0;
  const goodColor = "text-green-600 dark:text-green-400";
  const badColor = "text-red-500 dark:text-red-400";
  const deltaColor =
    delta === null
      ? "text-slate-400"
      : deltaPositiveIsGood
      ? isPositive ? goodColor : badColor
      : isPositive ? badColor : goodColor;

  return (
    <div className="flex flex-1 items-center gap-4 rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500 dark:text-[#6b7280]">{label}</div>
        <div className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-[#f9fafb]">{value}</div>
        {delta !== null ? (
          <div className={`mt-0.5 text-[11px] font-medium ${deltaColor}`}>
            {isPositive ? "↑" : "↓"} {Math.abs(delta)}% vs yesterday
          </div>
        ) : (
          <div className="mt-0.5 text-[11px] text-slate-400">—</div>
        )}
      </div>
    </div>
  );
}

function fmtDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function RideHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    channel?: string;
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
      : { status: { in: HISTORY_STATUSES } };

  const where: Record<string, unknown> = { ...statusWhere };
  if (sp.dateFrom || sp.dateTo) {
    where.createdAt = {
      ...(sp.dateFrom ? { gte: new Date(sp.dateFrom) } : {}),
      ...(sp.dateTo ? { lte: new Date(sp.dateTo + "T23:59:59") } : {}),
    };
  }
  if (sp.channel) where.bookingChannel = sp.channel;

  const dateWhere: Record<string, unknown> = {};
  if (sp.dateFrom || sp.dateTo) {
    dateWhere.createdAt = where.createdAt;
  }

  const [{ rides, total, approvedDrivers }, stats, cities] = await Promise.all([
    fetchRides({ cityId: session.cityId, where, take: perPage, skip, search }),
    fetchHistoryStats(session.cityId, dateWhere),
    fetchCities(session.cityId),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Build export URL
  const exportParams = new URLSearchParams();
  if (sp.status) exportParams.set("status", sp.status);
  if (sp.dateFrom) exportParams.set("dateFrom", sp.dateFrom);
  if (sp.dateTo) exportParams.set("dateTo", sp.dateTo);
  if (sp.channel) exportParams.set("channel", sp.channel);
  if (search) exportParams.set("search", search);
  const exportUrl = `/api/rides/export${exportParams.toString() ? `?${exportParams}` : ""}`;

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#555]">
            <span>Ride Operations</span>
            <span>›</span>
            <span className="text-slate-600 dark:text-[#9ca3af]">Ride History</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#f9fafb]">Ride History</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-[#6b7280]">
            Completed and cancelled rides
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <ExportDropdown exportUrl={exportUrl} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <RideOpsTabs active="history" />

      {/* ── Stats cards ── */}
      <div className="flex flex-wrap gap-3">
        <HistoryStatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          iconBg="bg-green-100 dark:bg-green-500/10"
          label="Completed Rides"
          value={stats.completed.toLocaleString("en-IN")}
          delta={stats.completedDelta}
          deltaPositiveIsGood={true}
        />
        <HistoryStatCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-100 dark:bg-red-500/10"
          label="Cancelled Rides"
          value={stats.cancelled.toLocaleString("en-IN")}
          delta={stats.cancelledDelta}
          deltaPositiveIsGood={false}
        />
        <HistoryStatCard
          icon={<DollarSign className="h-5 w-5 text-orange-500" />}
          iconBg="bg-orange-100 dark:bg-orange-500/10"
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          delta={stats.revenueDelta}
          deltaPositiveIsGood={true}
        />
        <HistoryStatCard
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-100 dark:bg-blue-500/10"
          label="Avg. Fare per Ride"
          value={stats.avgFare != null ? formatCurrency(stats.avgFare) : "—"}
          delta={null}
          deltaPositiveIsGood={true}
        />
        <HistoryStatCard
          icon={<Clock className="h-5 w-5 text-purple-500" />}
          iconBg="bg-purple-100 dark:bg-purple-500/10"
          label="Avg. Ride Duration"
          value={fmtDuration(stats.avgDurationMin)}
          delta={null}
          deltaPositiveIsGood={true}
        />
      </div>

      {/* ── Filter bar ── */}
      <HistoryFiltersBar
        cities={cities}
        initialSearch={search}
        initialDateFrom={sp.dateFrom}
        initialDateTo={sp.dateTo}
        initialChannel={sp.channel}
        initialStatus={sp.status}
      />

      {/* ── Table ── */}
      <RidesTable
        rides={rides}
        approvedDrivers={approvedDrivers}
        canWrite={canWrite}
        showScheduledColumn={false}
        emptyMessage="No ride history found"
        total={total}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        paginationBasePath="/ride-operations/history"
        paginationLabel="rides"
      />
    </div>
  );
}
