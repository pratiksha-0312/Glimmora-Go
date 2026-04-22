"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

type City = {
  id: string;
  name: string;
  archetype: "METRO" | "SMALL_TOWN";
  fareConfig: {
    baseFare: number;
    perKm: number;
    perMin: number;
    minimumFare: number;
  } | null;
};

export function FareEditor({ city }: { city: City }) {
  const router = useRouter();
  const fc = city.fareConfig;

  const [baseFare, setBaseFare] = useState(fc?.baseFare ?? 30);
  const [perKm, setPerKm] = useState(fc?.perKm ?? 12);
  const [perMin, setPerMin] = useState(fc?.perMin ?? 1.5);
  const [minimumFare, setMinimumFare] = useState(fc?.minimumFare ?? 50);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/cities/${city.id}/fare`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseFare, perKm, perMin, minimumFare }),
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900">{city.name}</h3>
          <Badge variant={city.archetype === "METRO" ? "info" : "default"}>
            {city.archetype}
          </Badge>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Field
          label="Base Fare (₹)"
          value={baseFare}
          onChange={setBaseFare}
        />
        <Field label="Per Km (₹)" value={perKm} onChange={setPerKm} step={0.5} />
        <Field
          label="Per Min (₹)"
          value={perMin}
          onChange={setPerMin}
          step={0.5}
        />
        <Field
          label="Minimum Fare (₹)"
          value={minimumFare}
          onChange={setMinimumFare}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
    </label>
  );
}
