import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { RideRowActions } from "./RideRowActions";
import type { RideStatus } from "../../../../generated/prisma";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: (RideStatus | "ALL")[] = [
  "ALL",
  "REQUESTED",
  "MATCHED",
  "IN_TRIP",
  "COMPLETED",
  "CANCELLED",
];

async function getData(status?: string) {
  try {
    const [rides, approvedDrivers] = await Promise.all([
      prisma.ride.findMany({
        where:
          status && status !== "ALL" ? { status: status as RideStatus } : {},
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          rider: { select: { name: true, phone: true } },
          driver: { select: { name: true, phone: true } },
          city: { select: { name: true } },
        },
      }),
      prisma.driver.findMany({
        where: { status: "APPROVED" },
        select: { id: true, name: true, phone: true, cityId: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { rides, approvedDrivers };
  } catch {
    return { rides: [], approvedDrivers: [] };
  }
}

export default async function RidesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { rides, approvedDrivers } = await getData(status);

  return (
    <div>
      <PageHeader
        title="Rides"
        description="Live ride monitoring with filters"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = (status ?? "ALL") === s;
          return (
            <a
              key={s}
              href={s === "ALL" ? "/rides" : `/rides?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </a>
          );
        })}
      </div>

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
                <th className="px-5 py-3 text-left">Started</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rides.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    No rides found
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
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <RideRowActions
                          id={r.id}
                          status={r.status}
                          currentDriverId={r.driverId}
                          cityDrivers={cityDrivers}
                        />
                      </td>
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
