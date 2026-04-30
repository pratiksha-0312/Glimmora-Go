"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function RidePagination({
  total,
  page,
  perPage,
  totalPages,
  basePath = "/ride-operations",
  label = "rides",
}: {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  basePath?: string;
  label?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  function go(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${basePath}?${params.toString()}`);
  }

  function changePerPage(val: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("perPage", String(val));
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  }

  const pageNums: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else {
    pageNums.push(1);
    if (page > 3) pageNums.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNums.push(i);
    if (page < totalPages - 2) pageNums.push("…");
    pageNums.push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 dark:border-[#2a2a2a]">
      <span className="text-sm text-slate-500 dark:text-[#6b7280]">
        Showing {from} to {to} of {total.toLocaleString("en-IN")} {label}
      </span>

      <div className="flex items-center gap-2">
        {/* Per-page select */}
        <div className="flex items-center gap-1.5">
          <select
            value={perPage}
            onChange={(e) => changePerPage(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#9ca3af]"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        </div>

        {/* Prev */}
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {pageNums.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                p === page
                  ? "bg-orange-500 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:bg-[#252525]"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
