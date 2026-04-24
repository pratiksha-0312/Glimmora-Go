"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Archetype = "METRO" | "SMALL_TOWN";
type Defaults = {
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

export function ArchetypeCard({
  defaults,
  canWrite,
}: {
  defaults: Defaults;
  canWrite: boolean;
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
  const [saved, setSaved] = useState(false);

  function togglePayment(p: string) {
    setPayments((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/archetypes/${defaults.archetype}`, {
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
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const title = defaults.archetype === "METRO" ? "Metro" : "Small Town";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">
            Default values applied to new {title.toLowerCase()} cities
          </p>
        </div>
        {canWrite && (
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "..." : saved ? "Saved ✓" : "Save"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Match radius (km)">
          <input
            type="number"
            step={0.5}
            disabled={!canWrite}
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-slate-50"
          />
        </Field>
        <Field label="Surge ×">
          <input
            type="number"
            step={0.1}
            min={1}
            disabled={!canWrite}
            value={surge}
            onChange={(e) => setSurge(parseFloat(e.target.value) || 1)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-slate-50"
          />
        </Field>
        <Field label="Base fare (₹)">
          <input
            type="number"
            disabled={!canWrite}
            value={baseFare}
            onChange={(e) => setBaseFare(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-slate-50"
          />
        </Field>
        <Field label="Minimum fare (₹)">
          <input
            type="number"
            disabled={!canWrite}
            value={minFare}
            onChange={(e) => setMinFare(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-slate-50"
          />
        </Field>
        <Field label="Per km (₹)">
          <input
            type="number"
            step={0.5}
            disabled={!canWrite}
            value={perKm}
            onChange={(e) => setPerKm(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-slate-50"
          />
        </Field>
        <Field label="Per min (₹)">
          <input
            type="number"
            step={0.1}
            disabled={!canWrite}
            value={perMin}
            onChange={(e) => setPerMin(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-slate-50"
          />
        </Field>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs font-medium text-slate-600">Payments</div>
        <div className="flex gap-2">
          {ALL_PAYMENTS.map((p) => {
            const on = payments.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => canWrite && togglePayment(p)}
                disabled={!canWrite}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  on
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-white text-slate-600 ring-slate-200"
                } ${!canWrite ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
