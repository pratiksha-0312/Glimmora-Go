import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { requireAccess } from "@/lib/auth";
import { FraudSignals } from "./FraudSignals";

export const dynamic = "force-dynamic";

const RANGE_PILLS = [
  { value: "1", label: "24h" },
  { value: "7", label: "7d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
];

async function getEvents(days: number, entityType?: string, adminId?: string) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  try {
    return await prisma.auditEvent.findMany({
      where: {
        createdAt: { gte: since },
        ...(entityType ? { entityType } : {}),
        ...(adminId ? { adminId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  } catch {
    return [];
  }
}

async function getAdmins() {
  try {
    return await prisma.admin.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    days?: string;
    entityType?: string;
    adminId?: string;
  }>;
}) {
  await requireAccess("audit");
  const sp = await searchParams;
  const days = Math.max(1, Math.min(365, Number(sp.days ?? 7)));
  const [events, admins] = await Promise.all([
    getEvents(days, sp.entityType, sp.adminId),
    getAdmins(),
  ]);

  const entityTypes = Array.from(new Set(events.map((e) => e.entityType)));

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Configuration" },
          { label: "Audit Logs" },
        ]}
        title="Audit & Compliance"
        description="Every mutating admin action, plus fraud signals"
        action={
          <a
            href={`/api/audit/export?days=${days}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-[color:var(--brand-cream)]"
          >
            Export CSV
          </a>
        }
      />

      <FraudSignals />

      <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
        {RANGE_PILLS.map((r) => {
          const active = String(days) === r.value;
          const params = new URLSearchParams({
            days: r.value,
            ...(sp.entityType ? { entityType: sp.entityType } : {}),
            ...(sp.adminId ? { adminId: sp.adminId } : {}),
          });
          return (
            <Link
              key={r.value}
              href={`/configuration/audit?${params.toString()}`}
              className={
                active
                  ? "rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-[color:var(--brand-cream)]"
              }
            >
              {r.label}
            </Link>
          );
        })}

        <form className="ml-auto flex gap-2" action="/configuration/audit" method="get">
          <input type="hidden" name="days" value={days} />
          <select
            name="entityType"
            defaultValue={sp.entityType ?? ""}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
          >
            <option value="">All entities</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            name="adminId"
            defaultValue={sp.adminId ?? ""}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
          >
            <option value="">All admins</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-[color:var(--brand-500)] px-3 py-1 text-xs font-medium text-white hover:bg-[color:var(--brand-600)]">
            Filter
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-[color:var(--brand-sand-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[color:var(--brand-sand-border)] bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">When</th>
                <th className="px-5 py-3 text-left">Admin</th>
                <th className="px-5 py-3 text-left">Action</th>
                <th className="px-5 py-3 text-left">Entity</th>
                <th className="px-5 py-3 text-left">Summary</th>
                <th className="px-5 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    No audit events in this range
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-[color:var(--brand-cream)]">
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {e.adminName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {e.adminEmail}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="info">{e.action}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-700">
                      <span className="font-mono">
                        {e.entityType}:{e.entityId.slice(-6)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {e.summary ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {e.ip ?? "—"}
                    </td>
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
