"use client";

import { useMemo, useState } from "react";
import { Plus, Download, Upload, Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/rbac";
import type { AdminRole } from "../../../../generated/prisma";
import { NewAdminModal } from "./NewAdminModal";
import { AdminRoleSelect } from "./AdminRoleSelect";
import { AdminRowActions } from "./AdminRowActions";

export type AdminRow = {
  id: string;
  email: string;
  username: string | null;
  name: string;
  firstName: string | null;
  lastName: string | null;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLE_FILTERS: ("ALL" | AdminRole)[] = [
  "ALL",
  "SUPER_ADMIN",
  "OPERATIONS_MANAGER",
  "FINANCE_ADMIN",
  "SUPPORT_AGENT",
  "PARTNER_MANAGER",
];

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function userIdDisplay(index: number): string {
  return `ADM${String(index + 1).padStart(4, "0")}`;
}

export function AdminManagementClient({
  admins,
  currentAdminId,
  nextUserId,
}: {
  admins: AdminRow[];
  currentAdminId: string;
  nextUserId: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | AdminRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">(
    "ALL"
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return admins.filter((a) => {
      if (roleFilter !== "ALL" && a.role !== roleFilter) return false;
      if (statusFilter === "ACTIVE" && !a.active) return false;
      if (statusFilter === "DISABLED" && a.active) return false;
      if (!q) return true;
      const blob = [
        a.username ?? "",
        a.name,
        a.email,
        a.firstName ?? "",
        a.lastName ?? "",
        ROLE_LABELS[a.role],
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [admins, search, roleFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </button>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#a57865] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8e6553]"
        >
          <Plus className="h-3.5 w-3.5" />
          New Admin
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admin..."
                className="h-8 w-full rounded-md border border-transparent bg-white pl-7 pr-2 text-sm text-slate-800 outline-none focus:border-[#a57865] focus:ring-2 focus:ring-[#a57865]/20"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "ALL" | AdminRole)}
                className="h-8 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 focus:border-[#a57865] focus:ring-2 focus:ring-[#a57865]/20"
              >
                {ROLE_FILTERS.map((r) => (
                  <option key={r} value={r}>
                    {r === "ALL" ? "All Roles" : ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "DISABLED")
                }
                className="h-8 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 focus:border-[#a57865] focus:ring-2 focus:ring-[#a57865]/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">User ID</th>
                  <th className="px-5 py-3 text-left">User Name</th>
                  <th className="px-5 py-3 text-left">Full Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Last Login</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-slate-400"
                    >
                      No admins match your filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, i) => {
                    const isSelf = a.id === currentAdminId;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">
                          {userIdDisplay(admins.indexOf(a))}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-900">
                            {a.username ?? a.email.split("@")[0]}
                            {isSelf && (
                              <span className="ml-2 text-[11px] font-normal text-slate-400">
                                (you)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-700">{a.name}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {a.email}
                        </td>
                        <td className="px-5 py-3">
                          {!isSelf ? (
                            <AdminRoleSelect id={a.id} role={a.role} />
                          ) : (
                            <span className="text-xs text-slate-700">
                              {ROLE_LABELS[a.role]}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {a.active ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="default">Disabled</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {fmtDate(a.lastLoginAt)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {isSelf ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <AdminRowActions
                              admin={{
                                id: a.id,
                                userIdLabel: userIdDisplay(admins.indexOf(a)),
                                email: a.email,
                                username: a.username,
                                name: a.name,
                                firstName: a.firstName,
                                lastName: a.lastName,
                                role: a.role,
                                active: a.active,
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-2 text-[11px] text-slate-500">
              <span>
                Showing {filtered.length} of {admins.length}
              </span>
            </div>
          </div>

      <NewAdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        nextUserId={nextUserId}
      />
    </div>
  );
}
