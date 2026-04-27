"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

type City = {
  id: string;
  name: string;
  state: string;
  archetype: "METRO" | "SMALL_TOWN";
  active: boolean;
  matchingRadiusKm: number;
  surgeMultiplier: number;
  paymentOptions: string[];
  _count: { drivers: number; rides: number };
};

export function CityRow({ city }: { city: City }) {
  const router = useRouter();
  const [archetype, setArchetype] = useState(city.archetype);
  const [radius, setRadius] = useState(city.matchingRadiusKm);
  const [surge, setSurge] = useState(city.surgeMultiplier);
  const [active, setActive] = useState(city.active);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/cities/${city.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        archetype,
        matchingRadiusKm: radius,
        surgeMultiplier: surge,
        active,
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">
              {city.name}
            </h4>
            <Badge variant={active ? "success" : "default"}>
              {active ? "Active" : "Disabled"}
            </Badge>
          </div>
          <div className="text-xs text-slate-500">{city.state}</div>
          <div className="mt-1 text-xs text-slate-400">
            {city._count.drivers} drivers · {city._count.rides} rides
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "..." : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Archetype
          </span>
          <select
            value={archetype}
            onChange={(e) =>
              setArchetype(e.target.value as "METRO" | "SMALL_TOWN")
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="SMALL_TOWN">Small Town</option>
            <option value="METRO">Metro</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Match radius (km)
          </span>
          <input
            type="number"
            step={0.5}
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Surge ×
          </span>
          <input
            type="number"
            step={0.1}
            min={1}
            value={surge}
            onChange={(e) => setSurge(parseFloat(e.target.value) || 1)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 self-end">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs font-medium text-slate-600">Active</span>
        </label>
      </div>

      <div className="mt-3 flex gap-2 text-xs text-slate-500">
        Payments:{" "}
        {city.paymentOptions.map((p) => (
          <Badge key={p} variant="default">
            {p}
          </Badge>
        ))}
      </div>
    </div>
  );
}
