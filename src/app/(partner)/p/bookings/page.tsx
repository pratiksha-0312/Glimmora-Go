import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePartner } from "@/lib/partnerAuth";
import { Badge } from "@/components/ui/Badge";
import { rideStatusVariant } from "@/lib/format";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CancelButton } from "./CancelButton";

export const dynamic = "force-dynamic";

const CANCELLABLE = new Set(["REQUESTED", "MATCHED", "EN_ROUTE", "ARRIVED"]);

export default async function BookingsPage() {
  const session = await requirePartner();
  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    select: { commissionPct: true },
  });
  const commissionPct = partner?.commissionPct ?? 10;

  const rides = await prisma.ride.findMany({
    where: { bookedByPartnerId: session.partnerId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      pickupAddress: true,
      dropAddress: true,
      fareEstimate: true,
      fareFinal: true,
      createdAt: true,
      completedAt: true,
      rider: { select: { name: true, phone: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">My bookings</h1>
      <p className="mb-4 text-xs text-slate-500">
        Commission paid only on completed rides
      </p>

      {rides.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center text-sm text-slate-400 ring-1 ring-slate-200">
          No bookings yet
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((r) => {
            const fare = r.fareFinal ?? r.fareEstimate;
            const commission =
              r.status === "COMPLETED"
                ? Math.round((fare * commissionPct) / 100)
                : null;
            const cancellable = CANCELLABLE.has(r.status);
            return (
              <div
                key={r.id}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {r.pickupAddress}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      → {r.dropAddress}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {r.rider.name ?? "—"} · {r.rider.phone}
                    </div>
                  </div>
                  <Badge variant={rideStatusVariant(r.status)}>
                    {r.status}
                  </Badge>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-[11px] text-slate-400">
                    {formatDate(r.createdAt)}
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900">
                      {formatCurrency(fare)}
                    </div>
                    {commission !== null ? (
                      <div className="text-[11px] font-medium text-green-600">
                        Earned ₹{commission}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">
                        Pending completion
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                  <Link
                    href={`/p/bookings/${r.id}`}
                    className="text-[11px] font-medium text-brand-600 hover:text-brand-700"
                  >
                    View details →
                  </Link>
                  {cancellable && <CancelButton rideId={r.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
