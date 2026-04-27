"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CouponForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"FLAT" | "PERCENT">("FLAT");
  const [amount, setAmount] = useState(50);
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase(),
          description: description || undefined,
          discountType,
          amount,
          usageLimit: usageLimit === "" ? null : Number(usageLimit),
          validUntil: new Date(validUntil).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCode("");
      setDescription("");
      setAmount(50);
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-brand-500 dark:focus:ring-brand-900/30";

  return (
    <form onSubmit={submit} className="space-y-4 p-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        New Coupon
      </h3>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Code
        </label>
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="FIRSTRIDE"
          className={`${inputCls} font-mono uppercase tracking-widest`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Description
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="First ride free"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Type
          </label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "FLAT" | "PERCENT")}
            className={inputCls}
          >
            <option value="FLAT">Flat (₹)</option>
            <option value="PERCENT">Percent (%)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {discountType === "FLAT" ? "Amount (₹)" : "Percent"}
          </label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Usage limit
          </label>
          <input
            type="number"
            min={0}
            value={usageLimit}
            onChange={(e) =>
              setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="∞ unlimited"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Expires
          </label>
          <input
            type="date"
            required
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className={`${inputCls} dark:[color-scheme:dark]`}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60 active:scale-[0.98]"
      >
        {saving ? "Creating…" : "Create Coupon"}
      </button>
    </form>
  );
}
