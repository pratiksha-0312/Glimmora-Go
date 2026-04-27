import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { CorporateForm } from "./CorporateForm";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  if (status === "APPROVED") return <Badge variant="success">Approved</Badge>;
  if (status === "SUSPENDED") return <Badge variant="danger">Suspended</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

async function getData(cityId: string | null) {
  try {
    const [corporates, cities] = await Promise.all([
      prisma.corporate.findMany({
        where: cityId ? { cityId } : {},
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          city: { select: { name: true } },
          _count: { select: { members: true, rides: true } },
        },
      }),
      prisma.city.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { corporates, cities };
  } catch {
    return { corporates: [], cities: [] };
  }
}

export default async function CorporatesPage() {
  const session = await requireAccess("corporates");
  const canWrite = sessionCanWrite(session, "corporates");
  const { corporates, cities } = await getData(session.cityId);

  const totalWallet = corporates.reduce(
    (s, c) => s + (c.walletBalance ?? 0),
    0
  );
  const pending = corporates.filter((c) => c.status === "PENDING").length;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Partner Management" },
          { label: "Enterprise" },
        ]}
        title="Enterprise Accounts"
        description="Corporate / fleet customers with wallet ledger and employee rider lists"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Total accounts
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {corporates.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Pending approval
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-700">
            {pending}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Total wallet balance
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(totalWallet)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {canWrite && (
          <div className="lg:col-span-1">
            <CorporateForm cities={cities} />
          </div>
        )}

        <div className={canWrite ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                All accounts
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Contact</th>
                    <th className="px-5 py-3 text-left">City</th>
                    <th className="px-5 py-3 text-left">Members</th>
                    <th className="px-5 py-3 text-left">Rides</th>
                    <th className="px-5 py-3 text-left">Wallet</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corporates.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        No corporate accounts yet
                      </td>
                    </tr>
                  ) : (
                    corporates.map((c) => (
                      <tr key={c.id} className="hover:bg-[#fbf7f2]">
                        <td className="px-5 py-3">
                          <Link
                            href={`/corporates/${c.id}`}
                            className="font-medium text-slate-900 hover:text-brand-600"
                          >
                            {c.name}
                          </Link>
                          {c.gstin && (
                            <div className="font-mono text-[10px] text-slate-400">
                              GSTIN · {c.gstin}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-xs text-slate-700">
                            {c.contactName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {c.contactEmail}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          {c.city?.name ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-700">
                          {c._count.members}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-700">
                          {c._count.rides}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {formatCurrency(c.walletBalance)}
                        </td>
                        <td className="px-5 py-3">{statusBadge(c.status)}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
