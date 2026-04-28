"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Driver = { id: string; name: string; phone: string };

const PLAN_PRESET_AMOUNT: Record<"DAILY" | "WEEKLY" | "MONTHLY", number> = {
  DAILY: 30,
  WEEKLY: 150,
  MONTHLY: 500,
};

export function SubscriptionForm({
  drivers,
  onSuccess,
}: {
  drivers: Driver[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [driverId, setDriverId] = useState("");
  const [plan, setPlan] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [amount, setAmount] = useState<number>(PLAN_PRESET_AMOUNT.WEEKLY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!driverId) {
      setError("Pick a driver");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, plan, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDriverId("");
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Driver
        </label>
        <select
          required
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          <option value="">Pick an approved driver…</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.phone})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Plan
          </label>
          <select
            value={plan}
            onChange={(e) => {
              const p = e.target.value as "DAILY" | "WEEKLY" | "MONTHLY";
              setPlan(p);
              setAmount(PLAN_PRESET_AMOUNT[p]);
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="DAILY">Daily (1 day)</option>
            <option value="WEEKLY">Weekly (7 days)</option>
            <option value="MONTHLY">Monthly (30 days)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Amount (₹)
          </label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        If the driver already has an active plan, the new duration is added on
        top of their existing expiry.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onSuccess}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[color:var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-600)] disabled:opacity-60"
        >
          {saving ? "Granting…" : "Grant subscription"}
        </button>
      </div>
    </form>
  );
}
