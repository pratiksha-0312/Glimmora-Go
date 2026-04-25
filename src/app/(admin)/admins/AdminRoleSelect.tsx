"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "../../../../generated/prisma";
import { ROLE_LABELS } from "@/lib/rbac";

const SELECTABLE_ROLES: AdminRole[] = [
  "SUPER_ADMIN",
  "OPERATIONS_MANAGER",
  "FINANCE_ADMIN",
  "SUPPORT_AGENT",
  "PARTNER_MANAGER",
];

export function AdminRoleSelect({
  id,
  role,
  disabled,
}: {
  id: string;
  role: AdminRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<AdminRole>(role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: AdminRole) {
    setError(null);
    setBusy(true);
    const previous = value;
    setValue(next);
    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.refresh();
    } catch (err) {
      setValue(previous);
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <select
        value={value}
        disabled={busy || disabled}
        onChange={(e) => onChange(e.target.value as AdminRole)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 disabled:opacity-60"
      >
        {SELECTABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
