"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type City = {
  id: string;
  name: string;
  fareConfig: {
    womenMultiplier: number;
    seniorMultiplier: number;
    childrenMultiplier: number;
  } | null;
};

export function ConcessionEditor({ city }: { city: City }) {
  const router = useRouter();
  const fc = city.fareConfig;

  const [women, setWomen] = useState(fc?.womenMultiplier ?? 0.85);
  const [senior, setSenior] = useState(fc?.seniorMultiplier ?? 0.8);
  const [children, setChildren] = useState(fc?.childrenMultiplier ?? 0.9);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/cities/${city.id}/concessions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          womenMultiplier: women,
          seniorMultiplier: senior,
          childrenMultiplier: children,
        }),
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
        <h3 className="text-sm font-semibold text-slate-900">{city.name}</h3>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Slider
          label="Women"
          value={women}
          onChange={setWomen}
          hint={`${Math.round((1 - women) * 100)}% off`}
        />
        <Slider
          label="Senior"
          value={senior}
          onChange={setSenior}
          hint={`${Math.round((1 - senior) * 100)}% off`}
        />
        <Slider
          label="Children"
          value={children}
          onChange={setChildren}
          hint={`${Math.round((1 - children) * 100)}% off`}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-semibold text-brand-600">{hint}</span>
      </div>
      <input
        type="number"
        min={0.1}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 1)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
    </div>
  );
}
