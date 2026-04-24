"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "../../../../generated/prisma";

type City = { id: string; name: string };

const ROLE_OPTIONS: { value: AdminRole; label: string; hint: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin", hint: "Full access incl. admin management" },
  { value: "ADMIN", label: "Admin", hint: "Full access except admin management" },
  { value: "CITY_ADMIN", label: "City Admin", hint: "Full access scoped to one city" },
  { value: "VERIFIER", label: "Verifier", hint: "Driver document review only" },
  { value: "SUPPORT", label: "Support", hint: "Read-only rides, riders, reports" },
  { value: "VIEWER", label: "Viewer", hint: "Read-only across the board" },
];

export function AdminForm({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("ADMIN");
  const [cityId, setCityId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresCity = role === "CITY_ADMIN";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (requiresCity && !cityId) {
        throw new Error("Pick a city for City Admin");
      }
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          role,
          cityId: requiresCity ? cityId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEmail("");
      setName("");
      setPassword("");
      setRole("ADMIN");
      setCityId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const activeHint = ROLE_OPTIONS.find((o) => o.value === role)?.hint;

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-slate-900">New Admin</h3>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Email
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Password (min 8 chars)
        </label>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {activeHint && (
          <p className="mt-1 text-[11px] text-slate-500">{activeHint}</p>
        )}
      </div>

      {requiresCity && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            City
          </label>
          <select
            required
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">Pick a city…</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create admin"}
      </button>
    </form>
  );
}
