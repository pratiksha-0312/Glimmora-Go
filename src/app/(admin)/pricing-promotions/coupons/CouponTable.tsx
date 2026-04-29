"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { CouponRowActions } from "./CouponRowActions";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: "FLAT" | "PERCENT";
  amount: number;
  usageLimit: number | null;
  usedCount: number;
  validUntil: string;
  active: boolean;
};

const PAGE_SIZE = 10;

export function CouponTable({
  coupons,
  canWrite,
  onSelect,
  selectedId,
}: {
  coupons: Coupon[];
  canWrite: boolean;
  onSelect?: (coupon: Coupon) => void;
  selectedId?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const now = new Date();

  function getStatus(c: Coupon): "active" | "expired" | "disabled" {
    if (!c.active) return "disabled";
    if (new Date(c.validUntil) < now) return "expired";
    return "active";
  }

  const filtered = coupons.filter((c) => {
    const status = getStatus(c);
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (typeFilter !== "all" && c.discountType.toLowerCase() !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleStatus(val: string) {
    setStatusFilter(val);
    setPage(1);
  }

  function handleType(val: string) {
    setTypeFilter(val);
    setPage(1);
  }

  function reset() {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPage(1);
  }

  function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - now.getTime()) / 86_400_000);
  }

  const selectCls =
    "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search coupons..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition"
          />
        </div>

        <select value={statusFilter} onChange={(e) => handleStatus(e.target.value)} className={selectCls}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="disabled">Disabled</option>
        </select>

        <select value={typeFilter} onChange={(e) => handleType(e.target.value)} className={selectCls}>
          <option value="all">All Types</option>
          <option value="flat">Flat</option>
          <option value="percent">Percentage</option>
        </select>

      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Code
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Type
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Discount
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Usage
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Expires
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Status
              </th>
              {canWrite && (
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={canWrite ? 7 : 6}
                  className="px-5 py-12 text-center text-sm text-slate-400"
                >
                  No coupons found
                </td>
              </tr>
            ) : (
              paged.map((c) => {
                const status = getStatus(c);
                const days = daysUntil(c.validUntil);
                const usagePct = c.usageLimit
                  ? Math.min(100, Math.round((c.usedCount / c.usageLimit) * 100))
                  : 0;
                const expiredDate = new Date(c.validUntil).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelect?.(c)}
                    className={`transition-colors ${onSelect ? "cursor-pointer" : ""} ${
                      selectedId === c.id
                        ? "bg-orange-50/70 ring-1 ring-inset ring-orange-100"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Code + description */}
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-[13px] font-bold tracking-wide text-slate-900">
                        {c.code}
                      </div>
                      {c.description && (
                        <div className="mt-0.5 text-[11px] text-slate-400">{c.description}</div>
                      )}
                    </td>

                    {/* Type badge */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          c.discountType === "PERCENT"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {c.discountType === "PERCENT" ? "Percentage" : "Flat"}
                      </span>
                    </td>

                    {/* Discount amount */}
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {c.discountType === "FLAT" ? `₹${c.amount}` : `${c.amount}%`}
                    </td>

                    {/* Usage + progress bar */}
                    <td className="px-5 py-3.5">
                      <div className="min-w-[100px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">
                            {c.usedCount.toLocaleString("en-IN")} /{" "}
                            {c.usageLimit ? c.usageLimit.toLocaleString("en-IN") : "∞"}
                          </span>
                          {c.usageLimit && (
                            <span className="ml-2 font-semibold text-slate-500">{usagePct}%</span>
                          )}
                        </div>
                        {c.usageLimit ? (
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePct > 80 ? "bg-red-400" : "bg-emerald-400"
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        ) : (
                          <div className="mt-1.5 text-[10px] text-slate-300">Unlimited</div>
                        )}
                      </div>
                    </td>

                    {/* Expires */}
                    <td className="px-5 py-3.5">
                      <div className="text-[12px] font-medium text-slate-700">{expiredDate}</div>
                      <div
                        className={`mt-0.5 text-[11px] font-medium ${
                          days < 0
                            ? "text-red-400"
                            : days <= 7
                              ? "text-amber-500"
                              : "text-slate-400"
                        }`}
                      >
                        {days < 0
                          ? `${Math.abs(days)}d ago`
                          : days === 0
                            ? "today"
                            : `in ${days}d`}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          status === "active"
                            ? "bg-green-50 text-green-700"
                            : status === "expired"
                              ? "bg-red-50 text-red-600"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            status === "active"
                              ? "bg-green-500"
                              : status === "expired"
                                ? "bg-red-400"
                                : "bg-slate-400"
                          }`}
                        />
                        {status === "active" ? "Active" : status === "expired" ? "Expired" : "Disabled"}
                      </span>
                    </td>

                    {/* Actions */}
                    {canWrite && (
                      <td
                        className="px-5 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CouponRowActions id={c.id} active={c.active} />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
          <span className="text-[11px] text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-600">
              {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-semibold text-slate-600">{filtered.length}</span> coupons
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`h-7 min-w-[28px] rounded-lg px-1 text-xs font-semibold transition-colors ${
                      safePage === item
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
