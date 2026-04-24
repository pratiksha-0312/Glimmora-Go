"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  employeeId: string | null;
  active: boolean;
  createdAt: Date | string;
  rider: { id: string; phone: string; name: string | null };
};

export function MemberList({
  corporateId,
  members,
  canWrite,
}: {
  corporateId: string;
  members: Member[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/corporates/${corporateId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderPhone: phone,
          riderName: name.trim() || undefined,
          employeeId: employeeId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPhone("");
      setName("");
      setEmployeeId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function remove(memberId: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/corporates/${corporateId}/members/${memberId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Members ({members.length})
        </h3>
      </div>

      {canWrite && (
        <form
          onSubmit={add}
          className="grid gap-2 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:grid-cols-4"
        >
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Rider phone"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
          />
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Employee ID"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
          />
          <button
            disabled={loading}
            className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Adding…" : "Add member"}
          </button>
          {error && (
            <div className="col-span-full rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">
              {error}
            </div>
          )}
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left">Rider</th>
              <th className="px-5 py-3 text-left">Employee ID</th>
              <th className="px-5 py-3 text-left">Since</th>
              {canWrite && <th className="px-5 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={canWrite ? 4 : 3}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  No members yet
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">
                      {m.rider.name ?? "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {m.rider.phone}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {m.employeeId ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  {canWrite && (
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => remove(m.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
