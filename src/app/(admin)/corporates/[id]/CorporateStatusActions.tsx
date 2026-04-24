"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CorporateStatusActions({
  corporateId,
  currentStatus,
  reviewNote,
}: {
  corporateId: string;
  currentStatus: "PENDING" | "APPROVED" | "SUSPENDED";
  reviewNote: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState(reviewNote ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: "APPROVED" | "SUSPENDED" | "PENDING") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/corporates/${corporateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: note || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Approval
      </h4>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Review note (optional)
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Verified MSA + GST certificate"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          disabled={loading || currentStatus === "APPROVED"}
          onClick={() => setStatus("APPROVED")}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={loading || currentStatus === "SUSPENDED"}
          onClick={() => setStatus("SUSPENDED")}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Suspend
        </button>
        <button
          disabled={loading || currentStatus === "PENDING"}
          onClick={() => setStatus("PENDING")}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
        >
          Re-open review
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
