import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Car, Banknote, Users, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ReportsCharts } from "./ReportsCharts";

export const dynamic = "force-dynamic";

const RANGE_OPTIONS = [7, 14, 30, 90];

function parseDays(value: string | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 365) return 7;
  return Math.floor(n);
}

async function getReportData(days: number) {
  try {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rides = await prisma.ride.findMany({
      where: { createdAt: { gte: from } },
      select: {
        createdAt: true,
        status: true,
        fareFinal: true,
        fareEstimate: true,
        bookingChannel: true,
      },
    });

    const totalRides = rides.length;
    const totalRevenue = rides
      .filter((r) => r.status === "COMPLETED")
      .reduce((sum, r) => sum + (r.fareFinal ?? 0), 0);
    const completion = totalRides
      ? Math.round(
          (rides.filter((r) => r.status === "COMPLETED").length / totalRides) *
            100
        )
      : 0;

    const activeDrivers = await prisma.driver.count({
      where: { status: "APPROVED" },
    });

    const dayPoints: { date: string; rides: number; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      const dayRides = rides.filter(
        (r) => r.createdAt >= d && r.createdAt < next
      );
      dayPoints.push({
        date: d.toISOString().slice(5, 10),
        rides: dayRides.length,
        revenue: dayRides
          .filter((r) => r.status === "COMPLETED")
          .reduce((s, r) => s + (r.fareFinal ?? 0), 0),
      });
    }

    const channels: Record<string, number> = {};
    for (const r of rides) {
      channels[r.bookingChannel] = (channels[r.bookingChannel] ?? 0) + 1;
    }

    return {
      totalRides,
      totalRevenue,
      completion,
      activeDrivers,
      days: dayPoints,
      channels,
    };
  } catch {
    return {
      totalRides: 0,
      totalRevenue: 0,
      completion: 0,
      activeDrivers: 0,
      days: [],
      channels: {},
    };
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = parseDays(daysParam);
  const data = await getReportData(days);

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`Last ${days} days — rides, revenue, driver utilization, booking channels`}
        action={
          <a
            href={`/api/reports/export?days=${days}`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            Export CSV
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((r) => {
          const active = days === r;
          return (
            <a
              key={r}
              href={`/reports?days=${r}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {r} days
            </a>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Rides (${days}d)`}
          value={data.totalRides}
          icon={Car}
          accent="brand"
        />
        <StatCard
          label={`Revenue (${days}d)`}
          value={formatCurrency(data.totalRevenue)}
          icon={Banknote}
          accent="green"
        />
        <StatCard
          label="Completion Rate"
          value={`${data.completion}%`}
          icon={Activity}
          accent="blue"
        />
        <StatCard
          label="Active Drivers"
          value={data.activeDrivers}
          icon={Users}
          trend="Approved"
          accent="brand"
        />
      </div>

      <ReportsCharts days={data.days} channels={data.channels} />
    </div>
  );
}
