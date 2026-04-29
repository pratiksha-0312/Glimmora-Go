import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePartner } from "@/lib/partnerAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Plus, Car, Banknote, Activity, AlertCircle } from "lucide-react";
import { RideStatus } from "../../../../generated/prisma";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.EN_ROUTE,
  RideStatus.ARRIVED,
  RideStatus.IN_TRIP,
];

async function getStats(partnerId: string, commissionPct: number) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  try {
    const [todayBookings, todayCompleted, activeRides, recent] =
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
        prisma.ride.count({
          where: {
            bookedByPartnerId: partnerId,
            status: { in: ACTIVE_STATUSES },
          },
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
      ]);

    const todayCommission =
      (todayCompleted.reduce((s, r) => s + (r.fareFinal ?? 0), 0) *
        commissionPct) /
      100;

    return { todayBookings, todayCommission, activeRides, recent };
  } catch {
    return {
      todayBookings: 0,
      todayCommission: 0,
      activeRides: 0,
      recent: [],
    };
  }
}

export default async function PartnerHomePage() {
  const session = await requirePartner();
  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    select: {
      commissionPct: true,
      bankAccountNumber: true,
      bankIfsc: true,
    },
  });
  const commissionPct = partner?.commissionPct ?? 10;
  const approvedDocCount = await prisma.partnerDocument.count({
    where: { partnerId: session.partnerId, status: "APPROVED" },
  });
  const needsBank = !partner?.bankAccountNumber || !partner?.bankIfsc;
  const needsDocs = approvedDocCount === 0;
  const { todayBookings, todayCommission, activeRides, recent } =
    await getStats(session.partnerId, commissionPct);

  return (
    <div className="space-y-4">
      {(needsBank || needsDocs) && (
        <Link
          href="/p/profile"
          className="block rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-900">
                Complete your profile to receive payments
              </div>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-800">
                {needsDocs && (
                  <li>
                    Upload at least one KYC document (shop license, Aadhaar, etc.)
                  </li>
                )}
                {needsBank && (
                  <li>Add your bank account &amp; IFSC for payouts</li>
                )}
              </ul>
              <div className="mt-2 text-xs font-semibold text-amber-700 underline">
                Update profile →
              </div>
            </div>
          </div>
        </Link>
      )}

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
        <Stat
          label="Active rides"
          value={activeRides}
          icon={Activity}
          tint="amber"
        />
      </div>

      <Link
        href="/p/book"
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
              <Link
                key={r.id}
                href={`/p/bookings/${r.id}`}
                className="block px-4 py-3 transition hover:bg-slate-50"
              >
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
              </Link>
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
  tint: "brand" | "green" | "amber";
}) {
  const tintClasses =
    tint === "green"
      ? "bg-green-50 text-green-600"
      : tint === "amber"
        ? "bg-amber-50 text-amber-600"
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
