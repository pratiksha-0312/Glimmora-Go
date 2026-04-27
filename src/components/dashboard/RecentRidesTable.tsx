"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { rideStatusVariant } from "@/lib/format";
import { Search, Car, ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, ChevronDown, Check } from "lucide-react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type RideStatus = "REQUESTED" | "MATCHED" | "EN_ROUTE" | "ARRIVED" | "IN_TRIP" | "COMPLETED" | "CANCELLED";

export interface RideRow {
  id: string;
  status: RideStatus;
  fareFinal: number | null;
  fareEstimate: number;
  createdAt: Date;
  rider: { name: string | null; phone: string };
  driver: { name: string } | null;
  city: { name: string };
}

type FilterKey = "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED";
type SortKey = "newest" | "oldest" | "fare_desc" | "fare_asc";

const PAGE_SIZE = 10;
const ACTIVE_STATUSES: RideStatus[] = ["REQUESTED", "MATCHED", "EN_ROUTE", "ARRIVED", "IN_TRIP"];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL",       label: "All"       },
  { key: "ACTIVE",    label: "Active"    },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",    label: "Newest first"     },
  { key: "oldest",   label: "Oldest first"     },
  { key: "fare_desc", label: "Fare: High → Low" },
  { key: "fare_asc",  label: "Fare: Low → High" },
];

const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-rose-100   text-rose-700   dark:bg-rose-900/40   dark:text-rose-300",
  "bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300",
  "bg-cyan-100   text-cyan-700   dark:bg-cyan-900/40   dark:text-cyan-300",
];

function avatarColor(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusLabel(status: RideStatus): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function applyFilter(rides: RideRow[], key: FilterKey): RideRow[] {
  if (key === "ACTIVE")    return rides.filter((r) => ACTIVE_STATUSES.includes(r.status));
  if (key === "COMPLETED") return rides.filter((r) => r.status === "COMPLETED");
  if (key === "CANCELLED") return rides.filter((r) => r.status === "CANCELLED");
  return rides;
}

function applySearch(rides: RideRow[], q: string): RideRow[] {
  const lower = q.trim().toLowerCase();
  if (!lower) return rides;
  return rides.filter(
    (r) =>
      r.rider.name?.toLowerCase().includes(lower) ||
      r.rider.phone.includes(lower) ||
      r.driver?.name.toLowerCase().includes(lower) ||
      r.city.name.toLowerCase().includes(lower),
  );
}

function applySort(rides: RideRow[], sort: SortKey): RideRow[] {
  return [...rides].sort((a, b) => {
    if (sort === "oldest")    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "fare_desc") return (b.fareFinal ?? b.fareEstimate) - (a.fareFinal ?? a.fareEstimate);
    if (sort === "fare_asc")  return (a.fareFinal ?? a.fareEstimate) - (b.fareFinal ?? b.fareEstimate);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const current = SORT_OPTIONS.find((o) => o.key === value)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>{current.label}</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#1c2230]">
          {SORT_OPTIONS.map((o) => {
            const active = o.key === value;
            return (
              <button
                key={o.key}
                onClick={() => { onChange(o.key); setOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-xs transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                {o.label}
                {active && <Check className="h-3.5 w-3.5 text-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RecentRidesTable({ rides }: { rides: RideRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort]   = useState<SortKey>("newest");
  const [page, setPage]   = useState(1);

  const processed = useMemo(
    () => applySort(applySearch(applyFilter(rides, filter), search), sort),
    [rides, filter, search, sort],
  );

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const visible    = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeFilter(f: FilterKey) { setFilter(f); setPage(1); }
  function changeSearch(v: string)    { setSearch(v); setPage(1); }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#21262d] dark:bg-[#161b27]">

      {/* ── Panel header ─────────────────────────────────────────────── */}
      <div className="px-5 pt-4">

        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
              <Car className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Rides</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">{rides.length} trips loaded</p>
            </div>
          </div>

          {/* Search + Sort + View all */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search rider, driver, city…"
                value={search}
                onChange={(e) => changeSearch(e.target.value)}
                className="h-8 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-[#0d1117] dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>

            <SortDropdown
              value={sort}
              onChange={(v) => { setSort(v); setPage(1); }}
            />

            <a
              href="/rides"
              className="flex h-8 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              View all →
            </a>
          </div>
        </div>

        {/* ── Filter tab bar ────────────────────────────────────────── */}
        <div className="mt-3 flex items-center gap-0 border-b border-slate-200 dark:border-[#21262d]">
          {FILTERS.map(({ key, label }) => {
            const count  = applyFilter(rides, key).length;
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => changeFilter(key)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-4 pb-3 pt-1 text-xs font-medium transition-colors",
                  active
                    ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active
                      ? "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                      : "bg-slate-100 text-slate-400 dark:bg-[#21262d] dark:text-slate-500",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#0d1117]/60">
              {["Rider", "Driver", "City", "Fare", "Status", "Time"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Car className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No rides found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {search ? "Try a different search term" : "No rides match the selected filter"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={r.id}
                  className="group transition-colors hover:bg-slate-50 dark:hover:bg-[#1c2230]"
                >
                  {/* Rider */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          avatarColor(r.id),
                        )}
                      >
                        {initials(r.rider.name)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {r.rider.name ?? "Unknown"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {r.rider.phone}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Driver */}
                  <td className="px-5 py-3.5">
                    {r.driver ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                            avatarColor(r.driver.name),
                          )}
                        >
                          {initials(r.driver.name)}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">{r.driver.name}</span>
                      </div>
                    ) : (
                      <span className="italic text-slate-400 dark:text-slate-500">Unassigned</span>
                    )}
                  </td>

                  {/* City */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                      {r.city.name}
                    </div>
                  </td>

                  {/* Fare */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(r.fareFinal ?? r.fareEstimate)}
                    </div>
                    {!r.fareFinal && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">estimated</div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <Badge variant={rideStatusVariant(r.status)}>
                      {statusLabel(r.status)}
                    </Badge>
                  </td>

                  {/* Time */}
                  <td className="px-5 py-3.5">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {relativeTime(r.createdAt)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(r.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-[#21262d]">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, processed.length)} of {processed.length} rides
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                  safePage === p
                    ? "bg-brand-500 text-white shadow-sm"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
                )}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
