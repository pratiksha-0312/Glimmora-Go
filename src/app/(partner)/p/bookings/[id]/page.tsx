import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePartner } from "@/lib/partnerAuth";
import { Badge } from "@/components/ui/Badge";
import { rideStatusVariant } from "@/lib/format";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CancelButton } from "../CancelButton";

export const dynamic = "force-dynamic";

const CANCELLABLE = new Set(["REQUESTED", "MATCHED", "EN_ROUTE", "ARRIVED"]);

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePartner();
  const { id } = await params;

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      rider: { select: { name: true, phone: true } },
      driver: { select: { name: true, phone: true } },
      city: { select: { name: true } },
    },
  });
  if (!ride || ride.bookedByPartnerId !== session.partnerId) notFound();

  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    select: { commissionPct: true },
  });
  const commissionPct = partner?.commissionPct ?? 10;
  const fare = ride.fareFinal ?? ride.fareEstimate;
  const commission =
    ride.status === "COMPLETED"
      ? Math.round((fare * commissionPct) / 100)
      : null;
  const cancellable = CANCELLABLE.has(ride.status);

  return (
    <div className="space-y-4">
      <Link
        href="/p/bookings"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to bookings
      </Link>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Booking</h1>
            <div className="mt-0.5 font-mono text-[11px] text-slate-400">
              #{ride.id.slice(-8).toUpperCase()}
            </div>
          </div>
          <Badge variant={rideStatusVariant(ride.status)}>{ride.status}</Badge>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <Section title="Route">
          <Row label="Pickup">{ride.pickupAddress}</Row>
          <Row label="Drop">{ride.dropAddress}</Row>
          {ride.distanceKm != null && (
            <Row label="Distance">{ride.distanceKm} km</Row>
          )}
          {ride.durationMin != null && (
            <Row label="Duration">~{ride.durationMin} min</Row>
          )}
        </Section>

        <Section title="Rider">
          <Row label="Name">{ride.rider.name ?? "—"}</Row>
          <Row label="Phone">{ride.rider.phone}</Row>
        </Section>

        {ride.driver && (
          <Section title="Driver">
            <Row label="Name">{ride.driver.name}</Row>
            <Row label="Phone">{ride.driver.phone}</Row>
          </Section>
        )}

        <Section title="Fare">
          {ride.couponDiscount && ride.couponDiscount > 0 ? (
            <>
              <Row label="Subtotal">
                {formatCurrency(fare + ride.couponDiscount)}
              </Row>
              <Row label={`Coupon ${ride.couponCode ?? ""}`}>
                <span className="text-green-600">
                  − {formatCurrency(ride.couponDiscount)}
                </span>
              </Row>
            </>
          ) : null}
          <Row label="Total">
            <span className="font-semibold text-slate-900">
              {formatCurrency(fare)}
            </span>
          </Row>
          {commission != null && (
            <Row label="Your commission">
              <span className="font-semibold text-green-700">
                {formatCurrency(commission)}
              </span>
            </Row>
          )}
        </Section>

        <Section title="Timeline">
          <Row label="Booked">{formatDate(ride.createdAt)}</Row>
          {ride.completedAt && (
            <Row label="Completed">{formatDate(ride.completedAt)}</Row>
          )}
        </Section>
      </div>

      {cancellable && (
        <div className="flex justify-end rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <CancelButton rideId={ride.id} />
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-0">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right text-slate-900">{children}</span>
    </div>
  );
}
