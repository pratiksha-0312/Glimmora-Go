"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function CouponRowActions({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
    setLoading(false);
  }

  async function remove() {
    if (!confirm("Delete this coupon?")) return;
    setLoading(true);
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          active
            ? "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
        }`}
      >
        {active ? "Disable" : "Enable"}
      </button>
      <button
        onClick={remove}
        disabled={loading}
        className="flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
        title="Delete coupon"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
