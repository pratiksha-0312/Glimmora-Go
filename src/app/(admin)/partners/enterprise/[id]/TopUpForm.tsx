"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TopUpForm({ corporateId }: { corporateId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(1000);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(delta: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/corporates/${corporateId}/top-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: delta, note: note.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setNote("");
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
        Wallet
      </h4>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Amount (₹)
        </label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Note (optional)
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Oct 2026 advance"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          disabled={loading || amount <= 0}
          onClick={() => submit(Math.abs(amount))}
          className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          + Top up
        </button>
        <button
          disabled={loading || amount <= 0}
          onClick={() => submit(-Math.abs(amount))}
          className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-[#fbf7f2] disabled:opacity-60"
        >
          − Debit
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
