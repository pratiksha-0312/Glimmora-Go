"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket, CheckCircle2, Clock3, TrendingUp,
  Search, Plus, Pencil, Trash2,
  Check, AlertCircle, X, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";

/* ─── types ─────────────────────────────────────────────────────────── */

type DiscountType  = "FLAT" | "PERCENT";
type TypeFilter    = "ALL" | "FLAT" | "PERCENT";
type StatusFilter  = "ALL" | "ACTIVE" | "EXPIRED" | "DISABLED";

export interface CouponItem {
  id:           string;
  code:         string;
  description:  string | null;
  discountType: DiscountType;
  amount:       number;
  usageLimit:   number | null;
  usedCount:    number;
  validUntil:   string;
  active:       boolean;
}

/* ─── helpers ───────────────────────────────────────────────────────── */

/* Safe date formatter — accepts both "YYYY-MM-DD" and full ISO strings */
function fmtDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function couponStatus(c: CouponItem): "active" | "expired" | "disabled" {
  if (!c.active) return "disabled";
  if (new Date(c.validUntil) < new Date()) return "expired";
  return "active";
}

function discountLabel(c: CouponItem) {
  return c.discountType === "FLAT" ? `₹${c.amount} Off` : `${c.amount}% Off`;
}

/* ─── StatusBadge ───────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: "active" | "expired" | "disabled" }) {
  const cfg = {
    active:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    expired:  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    disabled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ─── TypeBadge ─────────────────────────────────────────────────────── */

function TypeBadge({ type }: { type: DiscountType }) {
  return type === "PERCENT" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
      % Percentage
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
      ₹ Flat
    </span>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────── */

function StatCard({
  label, value, icon: Icon, iconBg, iconColor, valueColor,
}: {
  label: string; value: string | number;
  icon: React.ElementType; iconBg: string; iconColor: string; valueColor: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#21262d] dark:bg-[#161b27]">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Coupon Preview card ───────────────────────────────────────────── */

function CouponPreview({
  code, description, discountType, amount, usageLimit, validUntil,
}: {
  code: string; description: string; discountType: DiscountType;
  amount: number; usageLimit: number | ""; validUntil: string;
}) {
  const preview  = code || "COUPON";
  const discount = discountType === "FLAT" ? `₹${amount} OFF` : `${amount}% OFF`;
  const expiry   = validUntil ? fmtDate(validUntil) : "—";

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Live Preview
      </p>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <span className="font-mono text-sm font-bold tracking-widest opacity-90">{preview}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
              {discountType === "FLAT" ? "Flat" : "Percent"}
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{discount}</p>
          <p className="mt-0.5 text-sm opacity-80">{description || "No description"}</p>
          <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs opacity-80">
            <span>Valid till {expiry}</span>
            <span>{usageLimit ? `Limit: ${usageLimit}` : "Unlimited"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Right panel (create / edit) ───────────────────────────────────── */

function defaultExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function CouponPanel({
  editing,
  onClose,
  onCreated,
}: {
  editing:    CouponItem | null;
  onClose:    () => void;
  onCreated?: (c: CouponItem) => void;
}) {
  const router = useRouter();
  const isEdit = !!editing;

  const [code,         setCode]         = useState(editing?.code ?? "");
  const [description,  setDescription]  = useState(editing?.description ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(editing?.discountType ?? "FLAT");
  const [amount,       setAmount]       = useState(editing?.amount ?? 50);
  const [usageLimit,   setUsageLimit]   = useState<number | "">(editing?.usageLimit ?? "");
  const [validUntil,   setValidUntil]   = useState(
    editing ? editing.validUntil.slice(0, 10) : defaultExpiry()
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [mode,          setMode]          = useState<"form" | "review">("form");
  const [createdCoupon, setCreatedCoupon] = useState<CouponItem | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        code: code.toUpperCase(),
        description: description || undefined,
        discountType,
        amount,
        usageLimit: usageLimit === "" ? null : Number(usageLimit),
        validUntil: validUntil + "T00:00:00.000Z",
      };
      const res = await fetch(
        isEdit ? `/api/coupons/${editing!.id}` : "/api/coupons",
        { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      if (isEdit) {
        router.refresh();
        onClose();
      } else {
        const fresh: CouponItem = {
          id:           data.id,
          code:         data.code,
          description:  data.description ?? null,
          discountType: data.discountType,
          amount:       data.amount,
          usageLimit:   data.usageLimit ?? null,
          usedCount:    data.usedCount  ?? 0,
          validUntil:   typeof data.validUntil === "string"
                          ? data.validUntil
                          : new Date(data.validUntil).toISOString(),
          active:       data.active ?? true,
        };
        onCreated?.(fresh);
        setCreatedCoupon(fresh);
        setMode("review");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setCode("");
    setDescription("");
    setDiscountType("FLAT");
    setAmount(50);
    setUsageLimit("");
    setValidUntil(defaultExpiry());
    setError(null);
    setCreatedCoupon(null);
    setMode("form");
  }

  const inp = [
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800",
    "outline-none transition placeholder:text-slate-400",
    "focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100",
    "dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100",
    "dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/30",
  ].join(" ");

  /* ── Review mode ─────────────────────────────────────────────────── */
  if (mode === "review" && createdCoupon) {
    return (
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#21262d] dark:bg-[#161b27]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-[#21262d]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Coupon Created!</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Code",        <span key="c" className="font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100">{createdCoupon.code}</span>],
                ["Discount",    <span key="d" className="font-semibold text-slate-900 dark:text-slate-100">{discountLabel(createdCoupon)}</span>],
                ["Type",        <TypeBadge key="t" type={createdCoupon.discountType} />],
                ["Usage Limit", <span key="u" className="text-slate-700 dark:text-slate-300">{createdCoupon.usageLimit ?? "Unlimited"}</span>],
                ["Expires",     <span key="e" className="text-slate-700 dark:text-slate-300">{fmtDate(createdCoupon.validUntil)}</span>],
                ["Status",      <StatusBadge key="s" status={couponStatus(createdCoupon)} />],
              ].map(([label, val]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          <CouponPreview
            code={createdCoupon.code}
            description={createdCoupon.description ?? ""}
            discountType={createdCoupon.discountType}
            amount={createdCoupon.amount}
            usageLimit={createdCoupon.usageLimit ?? ""}
            validUntil={createdCoupon.validUntil}
          />

          <div className="mt-4 space-y-2">
            <button onClick={resetForm}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Create Another
            </button>
            <button onClick={onClose}
              className="w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form mode ───────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#21262d] dark:bg-[#161b27]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-[#21262d]">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isEdit ? "bg-amber-100 dark:bg-amber-950/40" : "bg-brand-50 dark:bg-brand-950/40"}`}>
            <Ticket className={`h-4 w-4 ${isEdit ? "text-amber-600 dark:text-amber-400" : "text-brand-600 dark:text-brand-400"}`} />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? "Edit Coupon" : "Create New Coupon"}
          </p>
        </div>
        {isEdit && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={submit} className="space-y-3.5 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Code
          </label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. FIRSTRIDE"
            className={`${inp} font-mono uppercase tracking-widest`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="First ride free"
            className={inp}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Discount Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["FLAT", "PERCENT"] as DiscountType[]).map((t) => (
              <button
                key={t} type="button" onClick={() => setDiscountType(t)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition ${
                  discountType === t
                    ? "border-brand-500 bg-brand-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
                }`}
              >
                {t === "FLAT" ? "₹ Flat" : "% Percent"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {discountType === "FLAT" ? "Amount (₹)" : "Percent (%)"}
            </label>
            <input
              type="number" min={0} value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Usage Limit
            </label>
            <input
              type="number" min={0} value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="∞"
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Expiry Date
          </label>
          <input
            type="date"
            required
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600"
            style={{ colorScheme: "light" }}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit" disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.98]"
        >
          {saving
            ? (isEdit ? "Saving…" : "Creating…")
            : <><Check className="h-4 w-4" />{isEdit ? "Save Changes" : "Create Coupon"}</>
          }
        </button>

        {isEdit && (
          <button type="button" onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
            Cancel
          </button>
        )}
      </form>

      {/* Live preview */}
      <div className="border-t border-slate-100 px-5 pb-5 dark:border-[#21262d]">
        <CouponPreview
          code={code} description={description} discountType={discountType}
          amount={amount} usageLimit={usageLimit} validUntil={validUntil}
        />
      </div>
    </div>
  );
}

/* ─── Filter dropdowns ──────────────────────────────────────────────── */

const selectCls = "h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

function TypeDropdown({ value, onChange }: { value: TypeFilter; onChange: (v: TypeFilter) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value as TypeFilter)} className={selectCls}>
        <option value="ALL">All Types</option>
        <option value="FLAT">₹ Flat</option>
        <option value="PERCENT">% Percentage</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function StatusDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value as StatusFilter)} className={selectCls}>
        <option value="ALL">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="EXPIRED">Expired</option>
        <option value="DISABLED">Disabled</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────────── */

const PAGE_SIZE = 10;

export function CouponsClient({ coupons, canWrite }: { coupons: CouponItem[]; canWrite: boolean }) {
  const router = useRouter();

  const [localCoupons,  setLocalCoupons]  = useState<CouponItem[]>(coupons);
  const [search,        setSearch]        = useState("");
  const [typeFilter,    setTypeFilter]    = useState<TypeFilter>("ALL");
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("ALL");
  const [editing,       setEditing]       = useState<CouponItem | null>(null);
  const [showPanel,     setShowPanel]     = useState(canWrite);
  const [page,          setPage]          = useState(1);

  /* filtered list */
  const filtered = useMemo(() => {
    let list = localCoupons;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
      );
    }
    if (typeFilter   !== "ALL") list = list.filter((c) => c.discountType === typeFilter);
    if (statusFilter !== "ALL") list = list.filter((c) => couponStatus(c) === statusFilter.toLowerCase());
    return list;
  }, [localCoupons, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* summary stats */
  const totalRedemptions = localCoupons.reduce((s, c) => s + c.usedCount, 0);
  const activeCount      = localCoupons.filter((c) => couponStatus(c) === "active").length;
  const expiredCount     = localCoupons.filter((c) => couponStatus(c) === "expired").length;

  function openCreate() { setEditing(null); setShowPanel(true); }
  function openEdit(c: CouponItem) { setEditing(c); setShowPanel(true); }

  function handleCreated(newCoupon: CouponItem) {
    setLocalCoupons((prev) => [newCoupon, ...prev]);
    setPage(1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLocalCoupons((prev) => prev.filter((c) => c.id !== id));
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex gap-5">

      {/* ── Left: main ───────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">

        {/* Stat cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Coupons" value={localCoupons.length}
            icon={Ticket}
            iconBg="bg-blue-50 dark:bg-blue-950/40" iconColor="text-blue-600 dark:text-blue-400"
            valueColor="text-slate-900 dark:text-slate-100"
          />
          <StatCard
            label="Active Coupons" value={activeCount}
            icon={CheckCircle2}
            iconBg="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600 dark:text-emerald-400"
            valueColor="text-emerald-700 dark:text-emerald-400"
          />
          <StatCard
            label="Expired Coupons" value={expiredCount}
            icon={Clock3}
            iconBg="bg-amber-50 dark:bg-amber-950/40" iconColor="text-amber-600 dark:text-amber-400"
            valueColor="text-amber-700 dark:text-amber-400"
          />
          <StatCard
            label="Total Redemptions" value={totalRedemptions.toLocaleString()}
            icon={TrendingUp}
            iconBg="bg-teal-50 dark:bg-teal-950/40" iconColor="text-teal-600 dark:text-teal-400"
            valueColor="text-teal-700 dark:text-teal-400"
          />
        </div>

        {/* Toolbar: search + type filter + create button only */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 dark:border-[#21262d] dark:bg-[#161b27]">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by code or description…"
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="rounded p-0.5 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <TypeDropdown   value={typeFilter}   onChange={(v) => { setTypeFilter(v);   setPage(1); }} />
          <StatusDropdown value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />

          {canWrite && (
            <button
              onClick={openCreate}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Coupon
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#21262d] dark:bg-[#161b27]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-[#21262d] dark:bg-[#0d1117]/60">
                  {["Code", "Type", "Discount", "Usage", "Expires", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <Ticket className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {search || typeFilter !== "ALL" || statusFilter !== "ALL"
                            ? "No coupons match your filters"
                            : "No coupons yet"}
                        </p>
                        {canWrite && !search && typeFilter === "ALL" && statusFilter === "ALL" && (
                          <button onClick={openCreate} className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                            Create your first coupon →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => (
                    <tr key={c.id} className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1c2230]">
                      {/* Code */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            c.discountType === "FLAT"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                          }`}>
                            {c.discountType === "FLAT" ? "₹" : "%"}
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold tracking-widest text-slate-900 dark:text-slate-100">
                              {c.code}
                            </p>
                            {c.description && (
                              <p className="mt-0.5 max-w-[180px] truncate text-xs text-slate-400 dark:text-slate-500">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <TypeBadge type={c.discountType} />
                      </td>

                      {/* Discount */}
                      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {discountLabel(c)}
                      </td>

                      {/* Usage */}
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {c.usageLimit ? (
                          <span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{c.usedCount}</span>
                            {" / "}{c.usageLimit}
                          </span>
                        ) : (
                          <span className="text-slate-400">∞ Unlimited</span>
                        )}
                      </td>

                      {/* Expires */}
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {fmtDate(c.validUntil)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={couponStatus(c)} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          {canWrite && (
                            <button
                              onClick={() => openEdit(c)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-600 dark:hover:border-brand-600 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:border-red-800/60 dark:hover:bg-red-950/30"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination — only shown when there's more than one page */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-[#21262d]">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>
                {" "}of{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">{filtered.length}</span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`sep-${i}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition ${
                          safePage === p
                            ? "bg-brand-600 text-white shadow-sm"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500">10 / page</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: create / edit panel ───────────────────────────────── */}
      {canWrite && showPanel && (
        <div className="w-72 shrink-0 xl:w-80">
          <CouponPanel
            key={editing?.id ?? "new"}
            editing={editing}
            onClose={() => { setEditing(null); setShowPanel(false); }}
            onCreated={handleCreated}
          />
        </div>
      )}
    </div>
  );
}
