import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { docStatusVariant } from "@/lib/format";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { PartnerRowActions } from "../PartnerRowActions";
import { PartnerDocActions } from "./PartnerDocActions";
import { PayoutsSection } from "./PayoutsSection";
import { accruedSince } from "@/lib/payouts";
import type { PartnerStatus } from "../../../../../generated/prisma";

export const dynamic = "force-dynamic";

function partnerStatusVariant(s: PartnerStatus) {
  switch (s) {
    case "APPROVED":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "REJECTED":
    case "SUSPENDED":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAccess("partners");
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      city: true,
      documents: { orderBy: { uploadedAt: "desc" } },
      _count: { select: { bookings: true } },
    },
  });
  if (!partner) notFound();
  if (session.cityId && partner.cityId !== session.cityId)
    redirect("/partners");

  const canManage = sessionCanWrite(session, "partners");

  const payouts = await prisma.payout.findMany({
    where: { partnerId: partner.id },
    orderBy: { periodEnd: "desc" },
    include: { paidBy: { select: { name: true } } },
  });
  const lastEnd = payouts[0]?.periodEnd ?? null;
  const accrued = await accruedSince(
    partner.id,
    lastEnd,
    partner.commissionPct
  );
  const payoutsForClient = payouts.map((p) => ({
    id: p.id,
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
    rideCount: p.rideCount,
    grossFare: p.grossFare,
    commissionPct: p.commissionPct,
    amount: p.amount,
    status: p.status,
    reference: p.reference,
    note: p.note,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    paidBy: p.paidBy ? { name: p.paidBy.name } : null,
  }));
  const accruedForClient = {
    rideCount: accrued.rideCount,
    grossFare: accrued.grossFare,
    amount: accrued.amount,
    since: accrued.since ? accrued.since.toISOString() : null,
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Partner Management" },
          { label: "Partners", href: "/partners" },
          { label: "Partner" },
        ]}
        title={partner.shopName}
        description={`${partner.ownerName} · ${partner.phone}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Partner profile
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Status">
                <Badge variant={partnerStatusVariant(partner.status)}>
                  {partner.status}
                </Badge>
              </Row>
              <Row label="City">{partner.city.name}</Row>
              <Row label="Owner">{partner.ownerName}</Row>
              <Row label="Phone">{partner.phone}</Row>
              <Row label="Commission">{partner.commissionPct}%</Row>
              <Row label="Bookings">{partner._count.bookings}</Row>
              <Row label="Joined">{formatDate(partner.createdAt)}</Row>
            </dl>
            {canManage && (
              <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
                <PartnerRowActions
                  id={partner.id}
                  status={partner.status}
                  commissionPct={partner.commissionPct}
                />
              </div>
            )}
          </div>

          {partner.reviewNote && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="mb-1 font-medium">Review note</div>
              {partner.reviewNote}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <PayoutsSection
            partnerId={partner.id}
            initialPayouts={payoutsForClient}
            initialAccrued={accruedForClient}
            commissionPct={partner.commissionPct}
            canManage={canManage}
          />

          <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                KYC documents
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Uploaded by the partner via their PWA
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {partner.documents.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  Partner hasn't uploaded any documents yet
                </div>
              ) : (
                partner.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {doc.type.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-slate-500">
                        Uploaded {formatDate(doc.uploadedAt)}
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        View file →
                      </a>
                    </div>
                    {canManage ? (
                      <PartnerDocActions
                        partnerId={partner.id}
                        docId={doc.id}
                        status={doc.status}
                      />
                    ) : (
                      <Badge variant={docStatusVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}
