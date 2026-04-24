import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireKirana } from "@/lib/kiranaAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Plus, Car, Banknote } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats(partnerId: string, commissionPct: number) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  try {
    const [todayBookings, todayCompleted, recent, allTimeCompleted] =
      await Promise.all([
        prisma.ride.count({
          where: {
            bookedByPartnerId: partnerId,
            createdAt: { gte: startOfDay },
          },
        }),
        prisma.ride.findMany({
          where: {
            bookedByPartnerId: partnerId,
            status: "COMPLETED",
            completedAt: { gte: startOfDay },
          },
          select: { fareFinal: true },
        }),
        prisma.ride.findMany({
          where: { bookedByPartnerId: partnerId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            dropAddress: true,
            fareFinal: true,
            fareEstimate: true,
            createdAt: true,
          },
        }),
        prisma.ride.findMany({
          where: { bookedByPartnerId: partnerId, status: "COMPLETED" },
          select: { fareFinal: true },
        }),
      ]);

    const todayCommission =
      (todayCompleted.reduce((s, r) => s + (r.fareFinal ?? 0), 0) *
        commissionPct) /
      100;
    const allTimeCommission =
      (allTimeCompleted.reduce((s, r) => s + (r.fareFinal ?? 0), 0) *
        commissionPct) /
      100;

    return { todayBookings, todayCommission, recent, allTimeCommission };
  } catch {
    return {
      todayBookings: 0,
      todayCommission: 0,
      recent: [],
      allTimeCommission: 0,
    };
  }
}

export default async function KiranaHomePage() {
  const session = await requireKirana();
  const partner = await prisma.kiranaPartner.findUnique({
    where: { id: session.partnerId },
    select: { commissionPct: true },
  });
  const commissionPct = partner?.commissionPct ?? 10;
  const { todayBookings, todayCommission, recent, allTimeCommission } =
    await getStats(session.partnerId, commissionPct);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Today's bookings"
          value={todayBookings}
          icon={Car}
          tint="brand"
        />
        <Stat
          label="Today's commission"
          value={formatCurrency(todayCommission)}
          icon={Banknote}
          tint="green"
        />
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Lifetime commission
        </div>
        <div className="mt-1 text-2xl font-bold text-slate-900">
          {formatCurrency(allTimeCommission)}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          {commissionPct}% on completed bookings
        </div>
      </div>

      <Link
        href="/k/book"
        className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg hover:bg-brand-700"
      >
        <Plus className="h-5 w-5" />
        Book a ride for a customer
      </Link>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Recent bookings
          </h3>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            No bookings yet. Tap the button above to start.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {r.pickupAddress}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      → {r.dropAddress}
                    </div>
                  </div>
                  <Badge variant={rideStatusVariant(r.status)}>
                    {r.status}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{formatDate(r.createdAt)}</span>
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(r.fareFinal ?? r.fareEstimate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tint: "brand" | "green";
}) {
  const tintClasses =
    tint === "green"
      ? "bg-green-50 text-green-600"
      : "bg-brand-50 text-brand-600";
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className={`mb-2 inline-flex rounded-lg p-2 ${tintClasses}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
