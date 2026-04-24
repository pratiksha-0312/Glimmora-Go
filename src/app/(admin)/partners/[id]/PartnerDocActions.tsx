"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { docStatusVariant } from "@/lib/format";
import type { DocumentStatus } from "../../../../../generated/prisma";

export function PartnerDocActions({
  partnerId,
  docId,
  status,
}: {
  partnerId: string;
  docId: string;
  status: DocumentStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<DocumentStatus | "DELETE" | null>(null);

  async function update(newStatus: DocumentStatus) {
    setLoading(newStatus);
    try {
      await fetch(`/api/partners/${partnerId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this document?")) return;
    setLoading("DELETE");
    try {
      await fetch(`/api/partners/${partnerId}/documents/${docId}`, {
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
      <div className="flex items-center gap-2 text-xs font-medium">
        {status !== "APPROVED" && (
          <button
            onClick={() => update("APPROVED")}
            disabled={!!loading}
            className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading === "APPROVED" ? "…" : "Approve"}
          </button>
        )}
        {status !== "REJECTED" && (
          <button
            onClick={() => update("REJECTED")}
            disabled={!!loading}
            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading === "REJECTED" ? "…" : "Reject"}
          </button>
        )}
        <button
          onClick={remove}
          disabled={loading === "DELETE"}
          className="text-slate-400 hover:text-red-600 disabled:opacity-50"
        >
          {loading === "DELETE" ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
