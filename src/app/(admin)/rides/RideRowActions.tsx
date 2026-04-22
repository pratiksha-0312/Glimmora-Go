"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RideStatus } from "../../../../generated/prisma";

type DriverOption = { id: string; name: string; phone: string };

export function RideRowActions({
  id,
  status,
  cityDrivers,
  currentDriverId,
}: {
  id: string;
  status: RideStatus;
  cityDrivers: DriverOption[];
  currentDriverId: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState(false);
  const [driverId, setDriverId] = useState(currentDriverId ?? "");
  const [error, setError] = useState<string | null>(null);

  const terminal = status === "COMPLETED" || status === "CANCELLED";

  async function send(action: "CANCEL" | "COMPLETE" | "REASSIGN") {
    setError(null);
    setLoading(action);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "REASSIGN") {
        if (!driverId) {
          setError("Pick a driver");
          return;
        }
        body.driverId = driverId;
      }
      const res = await fetch(`/api/rides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReassigning(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  if (terminal) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  if (reassigning) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-500"
          >
            <option value="">Pick driver…</option>
            {cityDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.phone})
              </option>
            ))}
          </select>
          <button
            onClick={() => send("REASSIGN")}
            disabled={loading === "REASSIGN"}
            className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading === "REASSIGN" ? "…" : "Save"}
          </button>
          <button
            onClick={() => {
              setReassigning(false);
              setError(null);
            }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
        {error && <span className="text-[10px] text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-3 text-xs font-medium">
      <button
        onClick={() => setReassigning(true)}
        className="text-slate-600 hover:text-slate-900"
      >
        Reassign
      </button>
      {status === "IN_TRIP" || status === "ARRIVED" || status === "EN_ROUTE" ? (
        <button
          onClick={() => send("COMPLETE")}
          disabled={!!loading}
          className="text-green-600 hover:text-green-700 disabled:opacity-50"
        >
          {loading === "COMPLETE" ? "…" : "Complete"}
        </button>
      ) : null}
      <button
        onClick={() => {
          if (confirm("Cancel this ride?")) send("CANCEL");
        }}
        disabled={!!loading}
        className="text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {loading === "CANCEL" ? "…" : "Cancel"}
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
