import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { CorporateStatusActions } from "./CorporateStatusActions";
import { MemberList } from "./MemberList";
import { TopUpForm } from "./TopUpForm";

export const dynamic = "force-dynamic";

export default async function CorporateDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAccess("corporates");
  const canWrite = sessionCanWrite(session, "corporates");

  const corp = await prisma.corporate.findUnique({
    where: { id },
    include: {
      city: { select: { name: true } },
      members: {
        include: {
          rider: { select: { id: true, phone: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      topUps: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      rides: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          pickupAddress: true,
          dropAddress: true,
          fareFinal: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
  if (!corp) notFound();
  if (session.cityId && corp.cityId && corp.cityId !== session.cityId) {
    notFound();
  }

  const statusVariant =
    corp.status === "APPROVED"
      ? "success"
      : corp.status === "SUSPENDED"
        ? "danger"
        : "warning";

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Partner Management" },
          { label: "Enterprise", href: "/partners/enterprise" },
          { label: "Account" },
        ]}
        title={corp.name}
        description={`${corp.contactName} · ${corp.contactEmail} · ${corp.city?.name ?? "No city"}`}
        action={
          <Link
            href="/partners/enterprise"
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            ← All accounts
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Status
          </div>
          <div className="mt-2">
            <Badge variant={statusVariant}>{corp.status}</Badge>
          </div>
          {corp.reviewNote && (
            <div className="mt-2 text-[11px] text-slate-500">
              {corp.reviewNote}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Wallet balance
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(corp.walletBalance)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Members · Rides
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {corp.members.length} · {corp.rides.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MemberList
            corporateId={corp.id}
            members={corp.members}
            canWrite={canWrite}
          />

          <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Recent rides
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Route</th>
                    <th className="px-5 py-3 text-left">Fare</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corp.rides.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        No rides billed to this account yet
                      </td>
                    </tr>
                  ) : (
                    corp.rides.map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-3 text-xs text-slate-700">
                          {r.pickupAddress} → {r.dropAddress}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {r.fareFinal ? formatCurrency(r.fareFinal) : "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          {r.status}
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

          <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Wallet history
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Amount</th>
                    <th className="px-5 py-3 text-left">Note</th>
                    <th className="px-5 py-3 text-left">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corp.topUps.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        No top-ups yet
                      </td>
                    </tr>
                  ) : (
                    corp.topUps.map((t) => (
                      <tr key={t.id}>
                        <td
                          className={`px-5 py-3 text-sm font-semibold ${t.amount < 0 ? "text-red-700" : "text-green-700"}`}
                        >
                          {t.amount < 0 ? "−" : "+"}
                          {formatCurrency(Math.abs(t.amount))}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          {t.note ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {formatDate(t.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {canWrite && (
          <div className="space-y-6">
            <CorporateStatusActions
              corporateId={corp.id}
              currentStatus={corp.status}
              reviewNote={corp.reviewNote}
            />
            <TopUpForm corporateId={corp.id} />
          </div>
        )}
      </div>
    </div>
  );
}
