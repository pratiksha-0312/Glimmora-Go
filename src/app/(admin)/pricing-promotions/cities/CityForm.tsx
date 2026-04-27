"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CityForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [archetype, setArchetype] = useState<"METRO" | "SMALL_TOWN">(
    "SMALL_TOWN"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, state, archetype }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setName("");
      setState("");
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
          Name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rewa"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          State
        </label>
        <input
          required
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="Madhya Pradesh"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Archetype
        </label>
        <select
          value={archetype}
          onChange={(e) =>
            setArchetype(e.target.value as "METRO" | "SMALL_TOWN")
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          <option value="SMALL_TOWN">Small Town</option>
          <option value="METRO">Metro</option>
        </select>
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
          className="rounded-lg bg-[#a57865] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8e6253] disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add city"}
        </button>
      </div>
    </form>
  );
}
