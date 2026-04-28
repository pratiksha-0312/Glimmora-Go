"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Archetype = "METRO" | "SMALL_TOWN";

export type ArchetypeDefaults = {
  archetype: Archetype;
  matchingRadiusKm: number;
  surgeMultiplier: number;
  paymentOptions: string[];
  baseFare: number;
  perKm: number;
  perMin: number;
  minimumFare: number;
};

const ALL_PAYMENTS = ["CASH", "UPI", "CARD"] as const;

export function ArchetypeForm({
  defaults,
  onSuccess,
}: {
  defaults: ArchetypeDefaults;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [radius, setRadius] = useState(defaults.matchingRadiusKm);
  const [surge, setSurge] = useState(defaults.surgeMultiplier);
  const [payments, setPayments] = useState(defaults.paymentOptions);
  const [baseFare, setBaseFare] = useState(defaults.baseFare);
  const [perKm, setPerKm] = useState(defaults.perKm);
  const [perMin, setPerMin] = useState(defaults.perMin);
  const [minFare, setMinFare] = useState(defaults.minimumFare);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePayment(p: string) {
    setPayments((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/archetypes/${defaults.archetype}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchingRadiusKm: radius,
          surgeMultiplier: surge,
          paymentOptions: payments,
          baseFare,
          perKm,
          perMin,
          minimumFare: minFare,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Field label="Match radius (km)">
          <input
            type="number"
            step={0.5}
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </Field>
        <Field label="Surge ×">
          <input
            type="number"
            step={0.1}
            min={1}
            value={surge}
            onChange={(e) => setSurge(parseFloat(e.target.value) || 1)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </Field>
        <Field label="Minimum fare (₹)">
          <input
            type="number"
            value={minFare}
            onChange={(e) => setMinFare(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </Field>
        <Field label="Base fare (₹)">
          <input
            type="number"
            value={baseFare}
            onChange={(e) => setBaseFare(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </Field>
        <Field label="Per km (₹)">
          <input
            type="number"
            step={0.5}
            value={perKm}
            onChange={(e) => setPerKm(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </Field>
        <Field label="Per min (₹)">
          <input
            type="number"
            step={0.1}
            value={perMin}
            onChange={(e) => setPerMin(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </Field>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-slate-600">
          Accepted payments
        </div>
        <div className="flex gap-2">
          {ALL_PAYMENTS.map((p) => {
            const on = payments.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePayment(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                  on
                    ? "bg-[color:var(--brand-500)] text-white ring-[color:var(--brand-600)]"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-[color:var(--brand-cream)]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

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
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
