"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TicketLite = {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedToId: string | null;
  resolution: string | null;
};

export function TicketActions({
  ticket,
  admins,
}: {
  ticket: TicketLite;
  admins: { id: string; name: string; role: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignedToId, setAssignedToId] = useState(ticket.assignedToId ?? "");
  const [resolution, setResolution] = useState(ticket.resolution ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          assignedToId: assignedToId || null,
          resolution: resolution.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOk(true);
      router.refresh();
      setTimeout(() => setOk(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Manage
      </h4>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketLite["status"])}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as TicketLite["priority"])
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Assignee
        </label>
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Unassigned</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.role})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Resolution note
        </label>
        <textarea
          rows={3}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="What did you do to fix this?"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 ring-1 ring-green-200">
          Saved ✓
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
