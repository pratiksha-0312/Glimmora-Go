import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { PartnerRowActions } from "./PartnerRowActions";
import type { PartnerStatus } from "../../../../generated/prisma";

export const dynamic = "force-dynamic";

const FILTERS: (PartnerStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
];

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

async function getPartners(
  status: string | undefined,
  cityId: string | null
) {
  const where: Record<string, unknown> = {};
  if (cityId) where.cityId = cityId;
  if (status && status !== "ALL") where.status = status;
  try {
    return await prisma.partner.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        city: { select: { name: true } },
        _count: { select: { bookings: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAccess("partners");
  const canWrite = sessionCanWrite(session, "partners");
  const { status } = await searchParams;
  const partners = await getPartners(status, session.cityId);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Partner Management" },
          { label: "Partners" },
        ]}
        title="Partners"
        description="Kirana, CSC, metro counter, hospital desk — agents that book rides on behalf of walk-in customers"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((s) => {
          const active = (status ?? "ALL") === s;
          return (
            <a
              key={s}
              href={s === "ALL" ? "/partners" : `/partners?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-[color:var(--brand-500)] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-[color:var(--brand-cream)]"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </a>
          );
        })}
      </div>

      <div className="rounded-xl border border-[color:var(--brand-sand-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[color:var(--brand-sand-border)] bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Shop / counter</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Owner</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">City</th>
                <th className="px-5 py-3 text-left">Commission</th>
                <th className="px-5 py-3 text-left">Bookings</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Joined</th>
                {canWrite && (
                  <th className="px-5 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.length === 0 ? (
                <tr>
                  <td
                    colSpan={canWrite ? 10 : 9}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    No partners found
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="hover:bg-[color:var(--brand-cream)]">
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/partners/${p.id}`}
                        className="text-slate-900 hover:text-brand-600"
                      >
                        {p.shopName}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="default">
                        {p.type.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{p.ownerName}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {p.phone}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {p.city.name}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {p.commissionPct}%
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {p._count.bookings}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={partnerStatusVariant(p.status)}>
                        {p.status}
                      </Badge>
                      {p.reviewNote && (
                        <div className="mt-1 max-w-[180px] truncate text-[11px] italic text-slate-400">
                          “{p.reviewNote}”
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {formatDate(p.createdAt)}
                    </td>
                    {canWrite && (
                      <td className="px-5 py-3 text-right">
                        <PartnerRowActions
                          id={p.id}
                          status={p.status}
                          commissionPct={p.commissionPct}
                        />
                      </td>
                    )}
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
