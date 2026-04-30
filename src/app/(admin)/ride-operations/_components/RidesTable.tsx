import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { RideRowActions } from "./RideRowActions";
import { RidePagination } from "./RidePagination";
import { CheckCircle2, XCircle, Clock, Navigation, Zap } from "lucide-react";
import type { RideStatus } from "../../../../../generated/prisma";

type DriverOption = { id: string; name: string; phone: string; cityId: string | null };

type Ride = {
  id: string;
  status: RideStatus;
  pickupAddress: string;
  dropAddress: string;
  fareEstimate: number;
  fareFinal: number | null;
  bookingChannel: string;
  driverId: string | null;
  cityId: string;
  scheduledAt: Date | null;
  createdAt: Date;
  distanceKm?: number | null;
  durationMin?: number | null;
  rider: { name: string | null; phone: string };
  driver: { name: string; phone: string } | null;
  city: { name: string };
};

const AVATAR_COLORS = [
  "bg-orange-400", "bg-blue-500", "bg-green-500",
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
];

function avatarColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function StatusBadge({ status }: { status: RideStatus }) {
  const map: Record<RideStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    COMPLETED: { label: "Completed", cls: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400", icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400", icon: <XCircle className="h-3 w-3" /> },
    REQUESTED: { label: "Requested", cls: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400", icon: <Clock className="h-3 w-3" /> },
    MATCHED: { label: "Matched", cls: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", icon: <Zap className="h-3 w-3" /> },
    EN_ROUTE: { label: "En Route", cls: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", icon: <Navigation className="h-3 w-3" /> },
    ARRIVED: { label: "Arrived", cls: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", icon: <Navigation className="h-3 w-3" /> },
    IN_TRIP: { label: "In Trip", cls: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", icon: <Navigation className="h-3 w-3" /> },
  };
  const { label, cls, icon } = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

export function RidesTable({
  rides,
  approvedDrivers,
  canWrite,
  showScheduledColumn = false,
  emptyMessage = "No rides found",
  total,
  page,
  perPage,
  totalPages,
  paginationBasePath,
  paginationLabel,
}: {
  rides: Ride[];
  approvedDrivers: DriverOption[];
  canWrite: boolean;
  showScheduledColumn?: boolean;
  emptyMessage?: string;
  total?: number;
  page?: number;
  perPage?: number;
  totalPages?: number;
  paginationBasePath?: string;
  paginationLabel?: string;
}) {
  const showPagination = total !== undefined && page !== undefined && perPage !== undefined && totalPages !== undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-[#2a2a2a] dark:bg-[#181818] dark:text-[#6b7280]">
            <tr>
              <th className="px-5 py-3.5 text-left">Ride ID</th>
              <th className="px-5 py-3.5 text-left">Rider</th>
              <th className="px-5 py-3.5 text-left">Driver</th>
              <th className="px-5 py-3.5 text-left">Route</th>
              <th className="px-5 py-3.5 text-left">Channel</th>
              <th className="px-5 py-3.5 text-left">Fare</th>
              <th className="px-5 py-3.5 text-left">Status</th>
              <th className="px-5 py-3.5 text-left">{showScheduledColumn ? "Scheduled" : "Started"}</th>
              {canWrite && <th className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50 dark:divide-[#222]">
            {rides.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 9 : 8} className="px-5 py-14 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rides.map((r) => {
                const cityDrivers = approvedDrivers.filter((d) => d.cityId === r.cityId);
                const riderName = r.rider.name ?? "Unknown";
                const driverName = r.driver?.name ?? "";

                return (
                  <tr key={r.id} className="transition hover:bg-slate-50 dark:hover:bg-[#1e1e1e]">
                    {/* Ride ID */}
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs font-semibold text-slate-700 dark:text-[#d1d5db]">
                        {r.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-[#555]">
                        #{r.id.slice(-6).toUpperCase()}
                      </div>
                    </td>

                    {/* Rider */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(riderName)}`}>
                          {initials(riderName)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-[#e5e7eb]">{riderName}</div>
                          <div className="text-xs text-slate-400 dark:text-[#6b7280]">{r.rider.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Driver */}
                    <td className="px-5 py-3.5">
                      {r.driver ? (
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(driverName)}`}>
                            {initials(driverName)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-[#e5e7eb]">{driverName}</div>
                            <div className="text-xs text-slate-400 dark:text-[#6b7280]">{r.driver.phone}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-400 dark:bg-[#252525] dark:text-[#555]">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Route */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-1.5">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        <span className="line-clamp-1 text-xs text-slate-700 dark:text-[#d1d5db]">{r.pickupAddress}</span>
                      </div>
                      <div className="mt-1 flex items-start gap-1.5">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        <span className="line-clamp-1 text-xs text-slate-500 dark:text-[#6b7280]">{r.dropAddress}</span>
                      </div>
                      {(r.distanceKm != null || r.durationMin != null) && (
                        <div className="mt-1 text-[10px] text-slate-400 dark:text-[#555]">
                          {r.distanceKm != null && `${r.distanceKm.toFixed(1)} km`}
                          {r.distanceKm != null && r.durationMin != null && " • "}
                          {r.durationMin != null && `${r.durationMin}m`}
                        </div>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-[#252525] dark:text-[#9ca3af]">
                        {r.bookingChannel}
                      </span>
                    </td>

                    {/* Fare */}
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800 dark:text-[#e5e7eb]">
                        {formatCurrency(r.fareFinal ?? r.fareEstimate)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Started / Scheduled */}
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#6b7280]">
                      {showScheduledColumn && r.scheduledAt
                        ? formatDate(r.scheduledAt)
                        : formatDate(r.createdAt)}
                    </td>

                    {/* Actions */}
                    {canWrite && (
                      <td className="px-5 py-3.5">
                        <RideRowActions
                          id={r.id}
                          status={r.status}
                          currentDriverId={r.driverId}
                          cityDrivers={cityDrivers}
                          riderPhone={r.rider.phone}
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

      {/* Pagination */}
      {showPagination && (
        <RidePagination
          total={total}
          page={page}
          perPage={perPage}
          totalPages={totalPages}
          basePath={paginationBasePath}
          label={paginationLabel}
        />
      )}
    </div>
  );
}
