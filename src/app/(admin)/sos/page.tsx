import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { requireAccess } from "@/lib/auth";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSosRides(cityId: string | null) {
  const cityFilter = cityId ? { cityId } : {};
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const [rides, todayCount, activeCount] = await Promise.all([
      prisma.ride.findMany({
        where: { ...cityFilter, sosTriggered: true },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          rider: { select: { name: true, phone: true } },
          driver: { select: { name: true, phone: true } },
          city: { select: { name: true } },
        },
      }),
      prisma.ride.count({
        where: {
          ...cityFilter,
          sosTriggered: true,
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.ride.count({
        where: {
          ...cityFilter,
          sosTriggered: true,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      }),
    ]);
    return { rides, todayCount, activeCount };
  } catch {
    return { rides: [], todayCount: 0, activeCount: 0 };
  }
}

export default async function SosPage() {
  const session = await requireAccess("sos");
  const { rides, todayCount, activeCount } = await getSosRides(session.cityId);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Safety Monitoring" },
          { label: "SOS Alerts" },
        ]}
        title="SOS Alerts"
        description="Rides where the rider or driver triggered an SOS signal"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Active SOS"
          value={activeCount}
          icon={AlertTriangle}
          trend="In-progress rides"
          accent="red"
        />
        <StatCard
          label="SOS Today"
          value={todayCount}
          icon={Clock}
          accent="brand"
        />
        <StatCard
          label="Total SOS Events"
          value={rides.length}
          icon={ShieldCheck}
          trend="All time (last 100)"
          accent="blue"
        />
      </div>

      <div className="mt-6 rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">
            SOS Event Log
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Ride ID</th>
                <th className="px-5 py-3 text-left">Rider</th>
                <th className="px-5 py-3 text-left">Driver</th>
                <th className="px-5 py-3 text-left">City</th>
                <th className="px-5 py-3 text-left">Route</th>
                <th className="px-5 py-3 text-left">Fare</th>
                <th className="px-5 py-3 text-left">Ride Status</th>
                <th className="px-5 py-3 text-left">Triggered</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rides.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    No SOS events — all clear
                  </td>
                </tr>
              ) : (
                rides.map((r) => {
                  const isActive =
                    r.status !== "COMPLETED" && r.status !== "CANCELLED";
                  return (
                    <tr
                      key={r.id}
                      className={
                        isActive
                          ? "bg-red-50/50 hover:bg-red-50"
                          : "hover:bg-[#fbf7f2]"
                      }
                    >
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
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {r.city.name}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        <div className="line-clamp-1">{r.pickupAddress}</div>
                        <div className="line-clamp-1 text-slate-400">
                          → {r.dropAddress}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatCurrency(r.fareFinal ?? r.fareEstimate)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={rideStatusVariant(r.status)}>
                          {r.status}
                        </Badge>
                        {isActive && (
                          <Badge
                            variant="danger"
                            className="ml-1 animate-pulse"
                          >
                            LIVE
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/rides?status=${r.status}`}
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          View in rides →
                        </Link>
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
