"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PartnerStatus } from "../../../../generated/prisma";

export function PartnerRowActions({
  id,
  status,
  commissionPct,
}: {
  id: string;
  status: PartnerStatus;
  commissionPct: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<PartnerStatus | "COMMISSION" | null>(null);
  const [note, setNote] = useState("");
  const [pct, setPct] = useState(commissionPct);
  const [editing, setEditing] = useState(false);

  async function update(newStatus: PartnerStatus) {
    setLoading(newStatus);
    try {
      await fetch(`/api/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reviewNote: note || undefined,
        }),
      });
      setEditing(false);
      setNote("");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function updatePct() {
    setLoading("COMMISSION");
    try {
      await fetch(`/api/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPct: pct }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-1">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Review note (optional)"
          className="w-48 rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-500"
        />
        <div className="flex gap-1">
          <button
            onClick={() => update("APPROVED")}
            disabled={!!loading || status === "APPROVED"}
            className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading === "APPROVED" ? "…" : "Approve"}
          </button>
          <button
            onClick={() => update("REJECTED")}
            disabled={!!loading || status === "REJECTED"}
            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading === "REJECTED" ? "…" : "Reject"}
          </button>
          <button
            onClick={() => update("SUSPENDED")}
            disabled={!!loading || status === "SUSPENDED"}
            className="rounded bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading === "SUSPENDED" ? "…" : "Suspend"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <span className="text-[11px] text-slate-500">Commission %:</span>
          <input
            type="number"
            min={0}
            max={50}
            step={1}
            value={pct}
            onChange={(e) => setPct(parseFloat(e.target.value) || 0)}
            className="w-14 rounded border border-slate-200 px-1 py-0.5 text-xs outline-none focus:border-brand-500"
          />
          <button
            onClick={updatePct}
            disabled={loading === "COMMISSION"}
            className="rounded bg-[#a57865] px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#8e6253] disabled:opacity-50"
          >
            {loading === "COMMISSION" ? "…" : "Set"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs font-medium text-brand-600 hover:text-brand-700"
    >
      Review →
    </button>
  );
}
