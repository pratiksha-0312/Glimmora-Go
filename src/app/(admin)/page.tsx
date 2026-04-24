import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Car, Users, Banknote, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { requireAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getStats(cityId: string | null) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const cityFilter = cityId ? { cityId } : {};

  try {
    const [ridesToday, completedToday, activeDrivers, sosCount, recentRides] =
      await Promise.all([
        prisma.ride.count({
          where: { ...cityFilter, createdAt: { gte: startOfDay } },
        }),
        prisma.ride.findMany({
          where: {
            ...cityFilter,
            completedAt: { gte: startOfDay },
            status: "COMPLETED",
          },
          select: { fareFinal: true },
        }),
        prisma.driver.count({
          where: { ...cityFilter, online: true, status: "APPROVED" },
        }),
        prisma.ride.count({
          where: {
            ...cityFilter,
            sosTriggered: true,
            createdAt: { gte: startOfDay },
          },
        }),
        prisma.ride.findMany({
          where: cityFilter,
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            rider: { select: { phone: true, name: true } },
            driver: { select: { name: true } },
            city: { select: { name: true } },
          },
        }),
      ]);

    const revenueToday = completedToday.reduce(
      (sum, r) => sum + (r.fareFinal ?? 0),
      0
    );

    return { ridesToday, revenueToday, activeDrivers, sosCount, recentRides };
  } catch {
    return {
      ridesToday: 0,
      revenueToday: 0,
      activeDrivers: 0,
      sosCount: 0,
      recentRides: [],
      dbError: true as const,
    };
  }
}

export default async function DashboardPage() {
  const session = await requireAccess("dashboard");
  const stats = await getStats(session.cityId);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of today's rides, revenue, and live operations"
      />

      {"dbError" in stats && (
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
          value={stats.ridesToday}
          icon={Car}
          trend="Since 00:00"
          accent="brand"
        />
        <StatCard
          label="Revenue Today"
          value={formatCurrency(stats.revenueToday)}
          icon={Banknote}
          trend="Completed rides only"
          accent="green"
        />
        <StatCard
          label="Active Drivers"
          value={stats.activeDrivers}
          icon={Users}
          trend="Currently online"
          accent="blue"
        />
        <StatCard
          label="SOS Alerts"
          value={stats.sosCount}
          icon={AlertTriangle}
          trend="Today"
          accent="red"
        />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Rides</h2>
          <a
            href="/rides"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Rider</th>
                <th className="px-5 py-3 text-left">Driver</th>
                <th className="px-5 py-3 text-left">City</th>
                <th className="px-5 py-3 text-left">Fare</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentRides.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    No rides yet
                  </td>
                </tr>
              ) : (
                stats.recentRides.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">
                        {r.rider.name ?? "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.rider.phone}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {r.driver?.name ?? (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{r.city.name}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
