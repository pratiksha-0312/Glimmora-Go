"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelButton({ rideId }: { rideId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (!confirm("Cancel this booking?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/partner/bookings/${rideId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={cancel}
        disabled={busy}
        className="text-[11px] font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
      >
        {busy ? "Cancelling…" : "Cancel"}
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
