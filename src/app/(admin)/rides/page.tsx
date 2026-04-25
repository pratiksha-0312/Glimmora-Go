import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { RideRowActions } from "./RideRowActions";
import { AutoRefresh } from "./AutoRefresh";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { RideStatus } from "../../../../generated/prisma";
import { Activity, Calendar, History, List } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: (RideStatus | "ALL")[] = [
  "ALL",
  "REQUESTED",
  "MATCHED",
  "IN_TRIP",
  "COMPLETED",
  "CANCELLED",
];

const LIVE_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.EN_ROUTE,
  RideStatus.ARRIVED,
  RideStatus.IN_TRIP,
];
const HISTORY_STATUSES: RideStatus[] = [
  RideStatus.COMPLETED,
  RideStatus.CANCELLED,
];

type View = "all" | "live" | "scheduled" | "history";

const VIEWS: { id: View; label: string; icon: typeof Activity }[] = [
  { id: "all", label: "All Rides", icon: List },
  { id: "live", label: "Live Rides", icon: Activity },
  { id: "scheduled", label: "Scheduled", icon: Calendar },
  { id: "history", label: "History", icon: History },
];

function whereForView(view: View, status: string | undefined) {
  if (view === "live") {
    return { status: { in: LIVE_STATUSES } };
  }
  if (view === "scheduled") {
    return {
      scheduledAt: { gt: new Date() },
      status: { in: [RideStatus.REQUESTED, RideStatus.MATCHED] },
    };
  }
  if (view === "history") {
    return { status: { in: HISTORY_STATUSES } };
  }
  if (status && status !== "ALL") {
    return { status: status as RideStatus };
  }
  return {};
}

async function getData(view: View, status: string | undefined, cityId: string | null) {
  const cityFilter = cityId ? { cityId } : {};
  try {
    const [rides, approvedDrivers] = await Promise.all([
      prisma.ride.findMany({
        where: { ...cityFilter, ...whereForView(view, status) },
        orderBy:
          view === "scheduled"
            ? { scheduledAt: "asc" }
            : { createdAt: "desc" },
        take: 100,
        include: {
          rider: { select: { name: true, phone: true } },
          driver: { select: { name: true, phone: true } },
          city: { select: { name: true } },
        },
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

const VIEW_DESCRIPTION: Record<View, string> = {
  all: "All rides across statuses",
  live: "Rides currently in flight (REQUESTED → IN_TRIP)",
  scheduled: "Upcoming rides booked for a future time",
  history: "Completed and cancelled rides",
};

export default async function RidesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const session = await requireAccess("rides");
  const sp = await searchParams;
  const view: View = (() => {
    if (sp.view === "live" || sp.view === "scheduled" || sp.view === "history")
      return sp.view;
    return "all";
  })();
  const { rides, approvedDrivers } = await getData(view, sp.status, session.cityId);
  const canWrite = sessionCanWrite(session, "rides");

  const showStatusFilter = view === "all";
  const showScheduledColumn = view === "scheduled";

  return (
    <div>
      <PageHeader
        title="Ride Operations"
        description={VIEW_DESCRIPTION[view]}
        action={view === "live" ? <AutoRefresh /> : undefined}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {VIEWS.map((v) => {
          const active = view === v.id;
          const href = v.id === "all" ? "/rides" : `/rides?view=${v.id}`;
          const Icon = v.icon;
          return (
            <a
              key={v.id}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {v.label}
            </a>
          );
        })}
      </div>

      {showStatusFilter && (
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => {
            const active = (sp.status ?? "ALL") === s;
            return (
              <a
                key={s}
                href={s === "ALL" ? "/rides" : `/rides?status=${s}`}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                  active
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {s === "ALL" ? "All statuses" : s}
              </a>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Ride ID</th>
                <th className="px-5 py-3 text-left">Rider</th>
                <th className="px-5 py-3 text-left">Driver</th>
                <th className="px-5 py-3 text-left">Route</th>
                <th className="px-5 py-3 text-left">Channel</th>
                <th className="px-5 py-3 text-left">Fare</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">
                  {showScheduledColumn ? "Scheduled" : "Started"}
                </th>
                {canWrite && (
                  <th className="px-5 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rides.length === 0 ? (
                <tr>
                  <td
                    colSpan={canWrite ? 9 : 8}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    {view === "live"
                      ? "No rides currently in flight"
                      : view === "scheduled"
                        ? "No scheduled rides"
                        : view === "history"
                          ? "No history yet"
                          : "No rides found"}
                  </td>
                </tr>
              ) : (
                rides.map((r) => {
                  const cityDrivers = approvedDrivers.filter(
                    (d) => d.cityId === r.cityId
                  );
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">
                        {r.id.slice(0, 8)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">
                          {r.rider.name ?? "—"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.rider.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {r.driver ? (
                          <>
                            <div className="text-slate-900">{r.driver.name}</div>
                            <div className="text-xs text-slate-500">
                              {r.driver.phone}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        <div className="line-clamp-1">{r.pickupAddress}</div>
                        <div className="line-clamp-1 text-slate-400">
                          → {r.dropAddress}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="info">{r.bookingChannel}</Badge>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatCurrency(r.fareFinal ?? r.fareEstimate)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={rideStatusVariant(r.status)}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {showScheduledColumn && r.scheduledAt
                          ? formatDate(r.scheduledAt)
                          : formatDate(r.createdAt)}
                      </td>
                      {canWrite && (
                        <td className="px-5 py-3 text-right">
                          <RideRowActions
                            id={r.id}
                            status={r.status}
                            currentDriverId={r.driverId}
                            cityDrivers={cityDrivers}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
