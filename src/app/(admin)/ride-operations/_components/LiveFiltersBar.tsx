"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, Calendar, MapPin, SlidersHorizontal, ChevronDown, Check, RotateCcw } from "lucide-react";

function FilterSelect({
  icon,
  value,
  onChange,
  options,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 w-full items-center gap-2 rounded-lg border bg-white px-3 text-sm transition-all duration-150 dark:bg-[#252525] ${
          open
            ? "border-orange-400 ring-2 ring-orange-400/20 dark:border-orange-500"
            : "border-slate-200 hover:border-orange-300 dark:border-[#333]"
        }`}
      >
        <span className="shrink-0 text-slate-400">{icon}</span>
        <span className={`flex-1 truncate text-left text-sm ${
          selected?.value ? "font-medium text-slate-700 dark:text-[#f1f1f1]" : "text-slate-500 dark:text-[#6b7280]"
        }`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl dark:border-[#2a2a2a] dark:bg-[#1c1c1c]">
          <div className="py-1">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`group flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 ${
                    isActive
                      ? "bg-slate-50 font-medium text-slate-800 dark:bg-[#252525] dark:text-[#f1f1f1]"
                      : "text-slate-600 hover:bg-orange-500 hover:text-white dark:text-[#d1d5db] dark:hover:bg-orange-500 dark:hover:text-white"
                  }`}
                >
                  <Check className={`h-3.5 w-3.5 shrink-0 text-orange-500 transition-opacity group-hover:text-white ${isActive ? "opacity-100" : "opacity-0"}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const display = value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "All Dates";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.showPicker?.()}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-all hover:border-orange-300 dark:border-[#333] dark:bg-[#252525]"
      >
        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={`flex-1 text-left text-sm ${value ? "font-medium text-slate-700 dark:text-[#f1f1f1]" : "text-slate-500 dark:text-[#6b7280]"}`}>
          {display}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute inset-0 opacity-0"
        tabIndex={-1}
      />
    </div>
  );
}

export function LiveFiltersBar({
  cities,
  initialSearch,
  initialDate,
  initialStatus,
}: {
  cities: { id: string; name: string }[];
  initialSearch?: string;
  initialDate?: string;
  initialStatus?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [date, setDate] = useState(initialDate ?? "");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState(initialStatus ?? "");

  function apply(overrides?: { status?: string; date?: string }) {
    const st = overrides?.status ?? status;
    const dt = overrides?.date ?? date;
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (dt) params.set("date", dt);
    if (st) params.set("status", st);
    const qs = params.toString();
    router.push(`/ride-operations/live${qs ? `?${qs}` : ""}`);
  }

  function reset() {
    setSearch(""); setDate(""); setCity(""); setStatus("");
    router.push("/ride-operations/live");
  }

  const cityOptions = [
    { value: "", label: "All Cities" },
    ...cities.map((c) => ({ value: c.id, label: c.name })),
  ];

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "REQUESTED", label: "Requested" },
    { value: "MATCHED", label: "Matched" },
    { value: "IN_TRIP", label: "In Trip" },
    { value: "EN_ROUTE", label: "En Route" },
    { value: "ARRIVED", label: "Arrived" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      {/* Search */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Search by ride ID, rider or driver..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 dark:border-[#333] dark:bg-[#252525] dark:text-[#f1f1f1] dark:placeholder:text-[#555]"
        />
      </div>

      {/* Date */}
      <div className="w-44">
        <DateSelect value={date} onChange={(v) => { setDate(v); apply({ date: v }); }} />
      </div>

      {/* City */}
      <div className="w-36">
        <FilterSelect icon={<MapPin className="h-4 w-4" />} value={city} onChange={setCity} options={cityOptions} placeholder="All Cities" />
      </div>

      {/* Status */}
      <div className="w-40">
        <FilterSelect icon={<SlidersHorizontal className="h-4 w-4" />} value={status} onChange={(v) => { setStatus(v); apply({ status: v }); }} options={statusOptions} placeholder="All Statuses" />
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-[#333] dark:text-[#9ca3af] dark:hover:bg-[#252525]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>

      {/* Filter */}
      <button
        onClick={() => apply()}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-[#333] dark:text-[#9ca3af] dark:hover:bg-[#252525]"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filter
      </button>
    </div>
  );
}
