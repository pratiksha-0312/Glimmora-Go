"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "RIDE_ISSUE", label: "Ride issue" },
  { value: "SAFETY", label: "Safety" },
  { value: "PAYMENT", label: "Payment" },
  { value: "DRIVER_BEHAVIOR", label: "Driver behavior" },
  { value: "APP", label: "App bug" },
  { value: "OTHER", label: "Other" },
];

export function TicketForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter();
  const [category, setCategory] = useState("RIDE_ISSUE");
  const [priority, setPriority] = useState("NORMAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [rideId, setRideId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let riderId: string | null = null;
      if (riderPhone.trim()) {
        const r = await fetch(
          `/api/riders?q=${encodeURIComponent(riderPhone.trim())}&limit=1`
        );
        if (r.ok) {
          const data = await r.json();
          riderId = data.riders?.[0]?.id ?? null;
        }
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          priority,
          subject,
          description,
          riderId,
          rideId: rideId.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSubject("");
      setDescription("");
      setRiderPhone("");
      setRideId("");
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
          Subject
        </label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Short summary"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Description
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened?"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Rider phone (optional)
          </label>
          <input
            value={riderPhone}
            onChange={(e) => setRiderPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Ride ID (optional)
          </label>
          <input
            value={rideId}
            onChange={(e) => setRideId(e.target.value)}
            placeholder="ride cuid"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
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
          className="rounded-lg bg-[#a57865] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8e6253] disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create ticket"}
        </button>
      </div>
    </form>
  );
}
