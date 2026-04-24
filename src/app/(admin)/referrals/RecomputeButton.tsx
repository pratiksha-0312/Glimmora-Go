"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecomputeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/referrals/recompute", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(
        data.granted > 0
          ? `${data.granted} reward${data.granted === 1 ? "" : "s"} granted`
          : "No new rewards due"
      );
      router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-xs text-slate-500">{result}</span>
      )}
      <button
        onClick={run}
        disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Recomputing..." : "Recompute rewards"}
      </button>
    </div>
  );
}
