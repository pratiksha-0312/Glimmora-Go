"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocationPicker, type Location } from "./LocationPicker";

type Estimate = {
  fareEstimate: number;
  distanceKm: number;
  durationMin: number;
  commissionEstimate: number;
};

const CONCESSIONS = [
  { value: "NONE", label: "No concession" },
  { value: "WOMEN", label: "Women" },
  { value: "SENIOR", label: "Senior (60+)" },
  { value: "CHILDREN", label: "With children" },
] as const;

export function BookForm({
  commissionPct,
  cityName,
}: {
  commissionPct: number;
  cityName: string;
}) {
  const router = useRouter();
  const [riderPhone, setRiderPhone] = useState("");
  const [riderName, setRiderName] = useState("");
  const [pickup, setPickup] = useState<Location | null>(null);
  const [drop, setDrop] = useState<Location | null>(null);
  const [concession, setConcession] = useState<
    "NONE" | "WOMEN" | "SENIOR" | "CHILDREN"
  >("NONE");

  const [est, setEst] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estimate becomes stale whenever the inputs change
  useEffect(() => {
    setEst(null);
  }, [pickup, drop, concession]);

  const canEstimate = pickup && drop;
  const canConfirm =
    est && pickup && drop && riderPhone.length === 10;

  async function estimate() {
    if (!pickup || !drop) return;
    setError(null);
    setEstimating(true);
    try {
      const res = await fetch("/api/kirana/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropLat: drop.lat,
          dropLng: drop.lng,
          concession,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEst(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setEstimating(false);
    }
  }

  async function confirm() {
    if (!pickup || !drop) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/kirana/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderPhone,
          riderName: riderName || undefined,
          pickupAddress: pickup.address,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropAddress: drop.address,
          dropLat: drop.lat,
          dropLng: drop.lng,
          concession,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/k/bookings");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Customer
        </h3>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Phone (10 digits)
            </span>
            <input
              required
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              value={riderPhone}
              onChange={(e) =>
                setRiderPhone(e.target.value.replace(/\D/g, ""))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Name (optional)
            </span>
            <input
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Route
        </h3>
        <div className="space-y-3">
          <LocationPicker
            label="Pickup"
            color="#10b981"
            value={pickup}
            onChange={setPickup}
            cityName={cityName}
          />
          <LocationPicker
            label="Drop"
            color="#ef4444"
            value={drop}
            onChange={setDrop}
            cityName={cityName}
          />
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Concession
          </span>
          <select
            value={concession}
            onChange={(e) => setConcession(e.target.value as typeof concession)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            {CONCESSIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!est && (
        <button
          onClick={estimate}
          disabled={!canEstimate || estimating}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {estimating ? "Calculating..." : "Get fare estimate"}
        </button>
      )}

      {est && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Fare
              </div>
              <div className="text-3xl font-bold text-slate-900">
                ₹{est.fareEstimate}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>
                {est.distanceKm} km · ~{est.durationMin} min
              </div>
              <div className="mt-1 text-green-600">
                Your commission: ₹{est.commissionEstimate} ({commissionPct}%)
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEst(null)}
              className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Edit
            </button>
            <button
              onClick={confirm}
              disabled={submitting || !canConfirm}
              className="flex-[2] rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Booking..." : "Confirm booking"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
