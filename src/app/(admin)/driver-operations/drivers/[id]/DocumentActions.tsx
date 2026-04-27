"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { docStatusVariant } from "@/lib/format";
import type { DocumentStatus } from "../../../../../../generated/prisma";

export function DocumentActions({
  driverId,
  docId,
  status,
  reviewNote,
}: {
  driverId: string;
  docId: string;
  status: DocumentStatus;
  reviewNote: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<DocumentStatus | "DELETE" | null>(null);
  const [note, setNote] = useState(reviewNote ?? "");
  const [editing, setEditing] = useState(false);

  async function update(newStatus: DocumentStatus) {
    setLoading(newStatus);
    try {
      await fetch(`/api/drivers/${driverId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reviewNote: note || undefined,
        }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this document?")) return;
    setLoading("DELETE");
    try {
      await fetch(`/api/drivers/${driverId}/documents/${docId}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Badge variant={docStatusVariant(status)}>{status}</Badge>
      {editing ? (
        <div className="flex flex-col items-end gap-1">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Review note"
            className="w-48 rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-500"
          />
          <div className="flex gap-1">
            <button
              onClick={() => update("APPROVED")}
              disabled={!!loading}
              className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading === "APPROVED" ? "…" : "Approve"}
            </button>
            <button
              onClick={() => update("REJECTED")}
              disabled={!!loading}
              className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading === "REJECTED" ? "…" : "Reject"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setNote(reviewNote ?? "");
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-xs font-medium">
          <button
            onClick={() => setEditing(true)}
            className="text-brand-600 hover:text-brand-700"
          >
            Review →
          </button>
          <button
            onClick={remove}
            disabled={loading === "DELETE"}
            className="text-slate-400 hover:text-red-600 disabled:opacity-50"
          >
            {loading === "DELETE" ? "…" : "Delete"}
          </button>
        </div>
      )}
      {!editing && reviewNote && (
        <div className="max-w-[200px] text-right text-[11px] text-slate-500">
          “{reviewNote}”
        </div>
      )}
    </div>
  );
}
