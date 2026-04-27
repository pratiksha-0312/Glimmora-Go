import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { RideRowActions } from "./RideRowActions";
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
  rider: { name: string | null; phone: string };
  driver: { name: string; phone: string } | null;
  city: { name: string };
};

export function RidesTable({
  rides,
  approvedDrivers,
  canWrite,
  showScheduledColumn = false,
  emptyMessage = "No rides found",
}: {
  rides: Ride[];
  approvedDrivers: DriverOption[];
  canWrite: boolean;
  showScheduledColumn?: boolean;
  emptyMessage?: string;
}) {
  const colCount = canWrite ? 9 : 8;
  return (
    <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
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
              {canWrite && <th className="px-5 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rides.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-5 py-12 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rides.map((r) => {
                const cityDrivers = approvedDrivers.filter(
                  (d) => d.cityId === r.cityId
                );
                return (
                  <tr key={r.id} className="hover:bg-[#fbf7f2]">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {r.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#3a2d28]">
                        {r.rider.name ?? "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.rider.phone}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {r.driver ? (
                        <>
                          <div className="text-[#3a2d28]">{r.driver.name}</div>
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
                    <td className="px-5 py-3 font-medium text-[#3a2d28]">
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
  );
}
