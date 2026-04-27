import { prisma } from "@/lib/db";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { StatCard } from "@/components/ui/StatCard";
import { Car, Users, Banknote, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { requireAccess } from "@/lib/auth";
import { RevenueChart } from "@/components/ui/RevenueChart";
import { LiveMetrics } from "@/components/dashboard/LiveMetrics";
import { RecentRidesTable } from "@/components/dashboard/RecentRidesTable";

export const dynamic = "force-dynamic";

async function getStats(cityId: string | null) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const cityFilter = cityId ? { cityId } : {};

  try {
    const [
      ridesToday, completedToday, activeDrivers, sosCount, recentRides,
      newSignups, referralSignups,
    ] = await Promise.all([
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
          take: 30,
          include: {
            rider: { select: { phone: true, name: true } },
            driver: { select: { name: true } },
            city: { select: { name: true } },
          },
        }),
        prisma.rider.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.referral.count({ where: { createdAt: { gte: startOfDay } } }),
      ]);

    const revenueToday = completedToday.reduce(
      (sum, r) => sum + (r.fareFinal ?? 0),
      0
    );

    return {
      ridesToday, revenueToday, activeDrivers, sosCount, recentRides,
      newSignups, referralSignups,
    };
  } catch {
    return {
      ridesToday: 0,
      revenueToday: 0,
      activeDrivers: 0,
      sosCount: 0,
      recentRides: [],
      newSignups: 0,
      referralSignups: 0,
      dbError: true as const,
    };
  }
}

export default async function DashboardPage() {
  const session = await requireAccess("dashboard");
  const stats = await getStats(session.cityId);

  return (
    <div>
      <DashboardGreeting name={session.name} />

      {"dbError" in stats && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800">
          Database not reachable. Showing empty values. Run{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-900/50">
            npm run db:push
          </code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-900/50">
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

      <div className="mt-6">
        <LiveMetrics
          signups={stats.newSignups}
          sosAlerts={stats.sosCount}
          driversOnline={stats.activeDrivers}
          referralSignups={stats.referralSignups}
        />
      </div>

      <div className="mt-6">
        <RevenueChart />
      </div>

      <div className="mt-6">
        <RecentRidesTable rides={stats.recentRides} />
      </div>
    </div>
  );
}
