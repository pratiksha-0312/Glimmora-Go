"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DriverStatus } from "../../../../../../generated/prisma";

export function DriverActions({
  id,
  status,
}: {
  id: string;
  status: DriverStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<DriverStatus | null>(null);
  const [note, setNote] = useState("");

  async function update(newStatus: DriverStatus) {
    setLoading(newStatus);
    try {
      await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, verificationNote: note }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
      <textarea
        placeholder="Verification note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={!!loading || status === "APPROVED"}
          onClick={() => update("APPROVED")}
          className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {loading === "APPROVED" ? "..." : "Approve"}
        </button>
        <button
          disabled={!!loading || status === "REJECTED"}
          onClick={() => update("REJECTED")}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {loading === "REJECTED" ? "..." : "Reject"}
        </button>
        <button
          disabled={!!loading || status === "SUSPENDED"}
          onClick={() => update("SUSPENDED")}
          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          {loading === "SUSPENDED" ? "..." : "Suspend"}
        </button>
        <button
          disabled={!!loading || status === "PENDING"}
          onClick={() => update("PENDING")}
          className="rounded-lg bg-slate-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading === "PENDING" ? "..." : "Pending"}
        </button>
      </div>
    </div>
  );
}
