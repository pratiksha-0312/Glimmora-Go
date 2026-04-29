"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Ticket, Copy, Check, X } from "lucide-react";
import type { SelectedCoupon } from "./CouponsLayout";

function CouponPreview({
  code,
  description,
  discountType,
  amount,
  validUntil,
  usageLimit,
}: {
  code: string;
  description: string;
  discountType: "FLAT" | "PERCENT";
  amount: number;
  validUntil: string;
  usageLimit: number | "";
}) {
  const displayCode = code || "COUPONCODE";
  const displayDesc = description || "Coupon description";
  const validDate = validUntil
    ? new Date(validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const usageText = usageLimit ? `${Number(usageLimit).toLocaleString("en-IN")} uses` : "Unlimited";

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 px-5 py-5 dark:border-emerald-500/25 dark:from-emerald-500/8 dark:to-green-500/8">
      {/* Ticket notch cutouts */}
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-dashed border-emerald-200 bg-white dark:border-emerald-500/25 dark:bg-[#1a1a1a]" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-dashed border-emerald-200 bg-white dark:border-emerald-500/25 dark:bg-[#1a1a1a]" />

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
          <Ticket className="h-3 w-3" />
          {displayCode}
        </span>
        <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-800 dark:text-[#f3f4f6]">
          {discountType === "FLAT" ? `₹${amount} OFF` : `${amount}% OFF`}
        </div>
        <div className="mt-1 text-sm text-slate-500 dark:text-[#9ca3af]">{displayDesc}</div>
      </div>

      <div className="mx-4 my-4 border-t border-dashed border-emerald-200 dark:border-emerald-500/25" />

      <div className="flex items-center justify-between px-1 text-xs">
        <div>
          <div className="text-slate-400 dark:text-[#6b7280]">Valid till</div>
          <div className="mt-0.5 font-semibold text-slate-700 dark:text-[#e5e7eb]">{validDate}</div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 dark:text-[#6b7280]">Usage limit</div>
          <div className="mt-0.5 font-semibold text-slate-700 dark:text-[#e5e7eb]">{usageText}</div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-[#333333] dark:bg-[#222222] dark:text-[#f3f4f6] dark:placeholder-[#6b7280] dark:focus:ring-orange-500/20";

export function CouponForm({
  selectedCoupon,
  onDeselect,
}: {
  selectedCoupon?: SelectedCoupon | null;
  onDeselect?: () => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
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
  const [success, setSuccess] = useState(false);

  function copyCode(c: string) {
    navigator.clipboard.writeText(c).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
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
      setUsageLimit("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Create form ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4 dark:border-[#2a2a2a]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-500/10">
            <Sparkles className="h-4 w-4 text-orange-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#f9fafb]">Create New Coupon</h3>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {/* Code */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-[#d1d5db]">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FIRSTRIDE"
              className={inputCls + " font-mono uppercase tracking-wider"}
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-[#6b7280]">Unique code riders will apply</p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-[#d1d5db]">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="First ride free"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-[#6b7280]">Shown in admin panel only</p>
          </div>

          {/* Discount type */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-[#d1d5db]">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {(["FLAT", "PERCENT"] as const).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="discountType"
                    value={t}
                    checked={discountType === t}
                    onChange={() => setDiscountType(t)}
                    className="h-4 w-4 accent-orange-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-[#e5e7eb]">
                    {t === "FLAT" ? "Flat (₹)" : "Percentage (%)"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-[#d1d5db]">
              Discount Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 dark:text-[#6b7280]">
                {discountType === "FLAT" ? "₹" : "%"}
              </span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className={inputCls + " pl-7"}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-[#6b7280]">
              {discountType === "FLAT" ? "Flat discount in rupees" : "Percentage discount (0–100)"}
            </p>
          </div>

          {/* Usage limit + Expires */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-[#d1d5db]">
                Usage Limit
              </label>
              <input
                type="number"
                min={0}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="∞"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-[#d1d5db]">
                Expires On <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <p className="-mt-2 text-[11px] text-slate-400 dark:text-[#6b7280]">Leave empty for unlimited</p>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-green-50 px-3 py-2.5 text-xs font-medium text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30">
              Coupon created successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[.98] disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create coupon"}
          </button>
        </form>
      </div>

      {/* ── Coupon preview ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-[#2a2a2a]">
          <span className="text-sm font-semibold text-slate-900 dark:text-[#f9fafb]">
            {selectedCoupon ? "Selected Coupon" : "Coupon Preview"}
          </span>
          {selectedCoupon ? (
            <button
              onClick={onDeselect}
              className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-[#6b7280] dark:hover:bg-[#252525] dark:hover:text-[#d1d5db]"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-[#6b7280]">See how it will look</span>
          )}
        </div>
        <div className="space-y-3 p-4">
          {selectedCoupon ? (
            <>
              <CouponPreview
                code={selectedCoupon.code}
                description={selectedCoupon.description ?? ""}
                discountType={selectedCoupon.discountType}
                amount={selectedCoupon.amount}
                validUntil={selectedCoupon.validUntil}
                usageLimit={selectedCoupon.usageLimit ?? ""}
              />
              <button
                onClick={() => copyCode(selectedCoupon.code)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[.98] ${
                  copied
                    ? "bg-green-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#252525] dark:text-[#e5e7eb] dark:hover:bg-[#2e2e2e]"
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy coupon code"}
              </button>
            </>
          ) : (
            <>
              <CouponPreview
                code={code}
                description={description}
                discountType={discountType}
                amount={amount}
                validUntil={validUntil}
                usageLimit={usageLimit}
              />
              <button
                onClick={() => copyCode(code || "COUPONCODE")}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[.98] ${
                  copied
                    ? "bg-green-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#252525] dark:text-[#e5e7eb] dark:hover:bg-[#2e2e2e]"
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy coupon code"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
