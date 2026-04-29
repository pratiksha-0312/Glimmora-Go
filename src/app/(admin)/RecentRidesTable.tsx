"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { rideStatusVariant } from "@/lib/format";
import { formatCurrency } from "@/lib/utils";
import type { RideStatus } from "../../../generated/prisma";

export type RecentRide = {
  id: string;
  status: RideStatus;
  pickupAddress: string;
  dropAddress: string;
  fareEstimate: number;
  fareFinal: number | null;
  createdAt: string;
  completedAt: string | null;
  rider: { phone: string; name: string | null };
  driver: { name: string } | null;
  city: { name: string };
};

type Tab = "All" | "Active" | "Completed" | "Cancelled";

const ACTIVE_STATUSES: RideStatus[] = ["REQUESTED", "MATCHED", "EN_ROUTE", "ARRIVED", "IN_TRIP"];
const PAGE_SIZE = 10;

function Avatar({ name }: { name: string | null }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-[#252525] dark:text-[#9ca3af]">
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }) + ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function RecentRidesTable({
  initial,
  cities,
}: {
  initial: RecentRide[];
  cities: string[];
}) {
  const [rides, setRides] = useState<RecentRide[]>(initial);
  const [tab, setTab] = useState<Tab>("All");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch("/api/dashboard/live-rides", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setRides((prev) => {
          const liveIds = new Set((data.rides as RecentRide[]).map((r) => r.id));
          const nonLive = prev.filter((r) => !ACTIVE_STATUSES.includes(r.status) && !liveIds.has(r.id));
          return [...(data.rides as RecentRide[]), ...nonLive];
        });
      } catch {
        // keep stale data
      }
    };
    const id = setInterval(refresh, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const filtered = rides.filter((r) => {
    const matchCity = cityFilter === "All Cities" || r.city.name === cityFilter;
    const matchTab =
      tab === "All" ? true
      : tab === "Active" ? ACTIVE_STATUSES.includes(r.status)
      : tab === "Completed" ? r.status === "COMPLETED"
      : r.status === "CANCELLED";
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [
      r.rider.name ?? "",
      r.rider.phone,
      r.driver?.name ?? "",
      r.pickupAddress,
      r.dropAddress,
      r.city.name,
    ].some((v) => v.toLowerCase().includes(q));
    return matchCity && matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const baseFiltered = (statusFn: (r: RecentRide) => boolean) =>
    rides.filter((r) => {
      const matchCity = cityFilter === "All Cities" || r.city.name === cityFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || [
        r.rider.name ?? "", r.rider.phone, r.driver?.name ?? "",
        r.pickupAddress, r.dropAddress, r.city.name,
      ].some((v) => v.toLowerCase().includes(q));
      return statusFn(r) && matchCity && matchSearch;
    });

  const counts: Record<Tab, number> = {
    All: baseFiltered(() => true).length,
    Active: baseFiltered((r) => ACTIVE_STATUSES.includes(r.status)).length,
    Completed: baseFiltered((r) => r.status === "COMPLETED").length,
    Cancelled: baseFiltered((r) => r.status === "CANCELLED").length,
  };

  const handleTabChange = (t: Tab) => { setTab(t); setPage(1); };
  const handleCityChange = (c: string) => { setCityFilter(c); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-[#2a2a2a] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-[#f9fafb]">Recent Rides</h2>
          {(["All", "Active", "Completed", "Cancelled"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                tab === t
                  ? t === "Active"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                    : t === "Completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                      : t === "Cancelled"
                        ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                        : "bg-slate-900 text-white dark:bg-[#f9fafb] dark:text-[#111111]"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-[#252525] dark:text-[#9ca3af] dark:hover:bg-[#2e2e2e]"
              }`}
            >
              {t}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === t ? "bg-white/25 text-inherit" : "bg-slate-200 text-slate-600 dark:bg-[#2e2e2e] dark:text-[#9ca3af]"
              }`}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-[#6b7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search rider, driver..."
              className="h-8 w-48 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-[#333333] dark:bg-[#222222] dark:text-[#e5e7eb] dark:placeholder-[#6b7280] dark:focus:ring-orange-500/20"
            />
          </div>
          <select
            value={cityFilter}
            onChange={(e) => handleCityChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 dark:border-[#333333] dark:bg-[#222222] dark:text-[#e5e7eb]"
          >
            <option value="All Cities">All Cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-[#2a2a2a] dark:bg-[#141414]">
              {["Rider", "Driver", "City", "Fare", "Status", "Time", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#6b7280]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-[#1e1e1e]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-[#6b7280]">
                  No rides found
                </td>
              </tr>
            ) : (
              paginated.map((r) => {
                const fare = r.fareFinal ?? r.fareEstimate;
                return (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-[#1e1e1e]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.rider.name} />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-[#f3f4f6]">{r.rider.name ?? "—"}</div>
                          <div className="text-xs text-slate-400 dark:text-[#6b7280]">{r.rider.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {r.driver ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.driver.name} />
                          <div className="font-medium text-slate-900 dark:text-[#f3f4f6]">{r.driver.name}</div>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unmatched</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-[#d1d5db]">{r.city.name}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900 dark:text-[#f9fafb]">
                      {formatCurrency(fare)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={rideStatusVariant(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-[#9ca3af]">
                      {formatTime(r.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/rides?ride=${r.id}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-[#6b7280] dark:hover:bg-[#252525] dark:hover:text-[#d1d5db]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 border-t border-slate-100 px-6 py-3 dark:border-[#2a2a2a]">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:text-[#6b7280] dark:hover:bg-[#252525]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                p === safePage
                  ? "bg-slate-900 text-white dark:bg-[#f9fafb] dark:text-[#111111]"
                  : "text-slate-500 hover:bg-slate-100 dark:text-[#9ca3af] dark:hover:bg-[#252525]"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:text-[#6b7280] dark:hover:bg-[#252525]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
