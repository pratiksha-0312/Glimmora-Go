import { Fragment } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { requireAccess } from "@/lib/auth";
import {
  canFeature,
  RBAC_MATRIX_ROWS,
  RBAC_ROLE_COLUMNS,
} from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function RolesPermissionsPage() {
  const session = await requireAccess("admins");

  // Per Excel, only Super Admin can view the Roles & Permissions page.
  const hasAccess = canFeature(session.role, "config.roles_permissions");

  if (!hasAccess) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
          { label: "Configuration" },
          { label: "Admin Users", href: "/configuration/admins" },
          { label: "Roles & Permissions" },
        ]}
          title="Roles & Permissions"
          description="Read-only RBAC matrix"
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-800">
          You do not have permission to view this page. Contact a Super Admin.
        </div>
      </div>
    );
  }

  // Group rows by module for visual breaks
  const grouped: { module: string; rows: typeof RBAC_MATRIX_ROWS }[] = [];
  for (const row of RBAC_MATRIX_ROWS) {
    const last = grouped[grouped.length - 1];
    if (last && last.module === row.module) {
      last.rows.push(row);
    } else {
      grouped.push({ module: row.module, rows: [row] });
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Read-only matrix of admin roles and the features each role can access. Source of truth: the SOW RBAC sheet."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {RBAC_ROLE_COLUMNS.map((c) => (
          <Badge key={c.key} variant="info">
            {c.label}
          </Badge>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[color:var(--brand-sand-border)] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-[color:var(--brand-sand-border)] bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left">Feature</th>
              <th className="px-5 py-3 text-left">Sub-feature</th>
              {RBAC_ROLE_COLUMNS.map((c) => (
                <th key={c.key} className="px-3 py-3 text-center">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grouped.map((g) => (
              <Fragment key={g.module}>
                <tr className="bg-slate-50/50">
                  <td
                    colSpan={2 + RBAC_ROLE_COLUMNS.length}
                    className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-700"
                  >
                    {g.module}
                  </td>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.key} className="hover:bg-[color:var(--brand-cream)]">
                    <td className="px-5 py-2.5 text-slate-700">{r.feature}</td>
                    <td className="px-5 py-2.5 font-medium text-slate-900">
                      {r.subFeature}
                    </td>
                    {RBAC_ROLE_COLUMNS.map((c) => {
                      const allowed = canFeature(c.key, r.key);
                      return (
                        <td key={c.key} className="px-3 py-2.5 text-center">
                          {allowed ? (
                            <Check className="mx-auto h-4 w-4 text-green-600" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        This matrix is derived from{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5">src/lib/rbac.ts</code>.
        To change a permission, edit the <code className="rounded bg-slate-100 px-1 py-0.5">FEATURES</code>{" "}
        map in that file. Changing assignments per-admin is not yet wired.
      </div>
    </div>
  );
}
