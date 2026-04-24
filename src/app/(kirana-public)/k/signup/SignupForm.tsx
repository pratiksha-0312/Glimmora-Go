"use client";

import { useState } from "react";

type City = { id: string; name: string; state: string };

export function SignupForm({ cities }: { cities: City[] }) {
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/kirana/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, shopName, ownerName, cityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✓
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Application submitted
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Our team will review your application. You'll be able to sign in
            once approved.
          </p>
          <a
            href="/k/login"
            className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Shop name
        </label>
        <input
          required
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Ramji Kirana Store"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Owner name
        </label>
        <input
          required
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="Ram Kumar"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Phone (10 digits)
        </label>
        <input
          required
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={10}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="9876500000"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          City
        </label>
        <select
          required
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          {cities.length === 0 && <option value="">No cities available</option>}
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.state}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={saving || cities.length === 0}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
