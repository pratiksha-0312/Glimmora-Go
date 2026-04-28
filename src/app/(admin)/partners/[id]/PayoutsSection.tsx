"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type Payout = {
  id: string;
  periodStart: string;
  periodEnd: string;
  rideCount: number;
  grossFare: number;
  commissionPct: number;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED";
  reference: string | null;
  note: string | null;
  paidAt: string | null;
  paidBy?: { name: string } | null;
};

type Accrued = {
  rideCount: number;
  grossFare: number;
  amount: number;
  since: string | Date | null;
};

function payoutBadgeVariant(s: Payout["status"]) {
  if (s === "PAID") return "success" as const;
  if (s === "PENDING") return "warning" as const;
  return "danger" as const;
}

function fmtPeriod(start: string | Date, end: string | Date) {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  return `${fmt(s)} – ${fmt(e)}`;
}

export function PayoutsSection({
  partnerId,
  initialPayouts,
  initialAccrued,
  commissionPct,
  canManage,
}: {
  partnerId: string;
  initialPayouts: Payout[];
  initialAccrued: Accrued;
  commissionPct: number;
  canManage: boolean;
}) {
  const router = useRouter();
  const [payouts, setPayouts] = useState(initialPayouts);
  const [accrued, setAccrued] = useState(initialAccrued);
  const [showGenerate, setShowGenerate] = useState(false);
  const [editingPaidId, setEditingPaidId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Default the generate-payout window to: previous 7 days
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const [periodStart, setPeriodStart] = useState(
    weekAgo.toISOString().slice(0, 10)
  );
  const [periodEnd, setPeriodEnd] = useState(today.toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  async function refresh() {
    const res = await fetch(`/api/partners/${partnerId}/payouts`);
    if (res.ok) {
      const data = await res.json();
      setPayouts(data.payouts);
      setAccrued(data.accrued);
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart: new Date(periodStart).toISOString(),
          // include the entire end-day by setting time to 23:59:59
          periodEnd: new Date(periodEnd + "T23:59:59").toISOString(),
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setShowGenerate(false);
      setNote("");
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(payoutId: string, reference: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/partners/${partnerId}/payouts/${payoutId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PAID", reference }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEditingPaidId(null);
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function markFailed(payoutId: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/partners/${partnerId}/payouts/${payoutId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "FAILED" }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[color:var(--brand-sand-border)] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Payouts</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Accrued (since last payout):{" "}
            <span className="font-semibold text-slate-700">
              {formatCurrency(accrued.amount)}
            </span>{" "}
            on {accrued.rideCount} ride
            {accrued.rideCount === 1 ? "" : "s"} ·{" "}
            {commissionPct}% commission
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowGenerate((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
          >
            {showGenerate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showGenerate ? "Cancel" : "Generate payout"}
          </button>
        )}
      </div>

      {showGenerate && canManage && (
        <form
          onSubmit={generate}
          className="space-y-3 border-b border-slate-200 bg-slate-50 px-5 py-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Period start
              </label>
              <input
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Period end (inclusive)
              </label>
              <input
                type="date"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Weekly cycle 14"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {payouts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center text-sm text-slate-400">
            <Banknote className="h-7 w-7 text-slate-300" />
            No payouts yet
          </div>
        ) : (
          payouts.map((p) => (
            <div key={p.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {fmtPeriod(p.periodStart, p.periodEnd)}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {p.rideCount} ride{p.rideCount === 1 ? "" : "s"} · gross{" "}
                    {formatCurrency(p.grossFare)} · {p.commissionPct}%
                  </div>
                  {p.reference && (
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">
                      Ref: {p.reference}
                      {p.paidBy?.name ? ` · marked by ${p.paidBy.name}` : ""}
                    </div>
                  )}
                  {p.paidAt && (
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      Paid {formatDate(p.paidAt)}
                    </div>
                  )}
                  {p.note && (
                    <div className="mt-0.5 text-[11px] italic text-slate-400">
                      {p.note}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={payoutBadgeVariant(p.status)}>{p.status}</Badge>
                  <div className="text-base font-bold text-slate-900">
                    {formatCurrency(p.amount)}
                  </div>
                  {canManage && p.status !== "PAID" && (
                    <div className="flex flex-col items-end gap-1">
                      {editingPaidId === p.id ? (
                        <PaidForm
                          busy={busy}
                          onSubmit={(ref) => markPaid(p.id, ref)}
                          onCancel={() => setEditingPaidId(null)}
                        />
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingPaidId(p.id)}
                            className="rounded-md bg-green-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-green-700"
                          >
                            Mark paid
                          </button>
                          {p.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => markFailed(p.id)}
                              disabled={busy}
                              className="rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              Failed
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PaidForm({
  busy,
  onSubmit,
  onCancel,
}: {
  busy: boolean;
  onSubmit: (ref: string) => void;
  onCancel: () => void;
}) {
  const [ref, setRef] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ref.trim()) onSubmit(ref.trim());
      }}
      className="flex items-center gap-1"
    >
      <input
        type="text"
        autoFocus
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="UTR / ref"
        className="w-32 rounded-md border border-slate-300 px-2 py-1 text-[11px] outline-none focus:border-brand-500"
      />
      <button
        type="submit"
        disabled={busy || !ref.trim()}
        className="rounded-md bg-green-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600"
      >
        Cancel
      </button>
    </form>
  );
}
