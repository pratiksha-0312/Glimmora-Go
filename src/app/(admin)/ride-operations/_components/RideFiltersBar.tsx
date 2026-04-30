"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, MapPin, SlidersHorizontal, ChevronDown, Check } from "lucide-react";

// ── Custom dropdown — gives full hover/active color control ──────────────────
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
    <div ref={ref} className="relative w-36">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 w-full items-center gap-2 rounded-lg border bg-white px-3 text-sm transition-all duration-150 dark:bg-[#252525] ${
          open
            ? "border-orange-400 ring-2 ring-orange-400/20 dark:border-orange-500"
            : "border-slate-200 hover:border-orange-300 dark:border-[#333] dark:hover:border-orange-500/50"
        }`}
      >
        <span className="shrink-0 text-slate-400">{icon}</span>
        <span
          className={`flex-1 truncate text-left text-sm ${
            selected && selected.value !== ""
              ? "font-medium text-slate-700 dark:text-[#f1f1f1]"
              : "text-slate-500 dark:text-[#6b7280]"
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-[160px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl dark:border-[#2a2a2a] dark:bg-[#1c1c1c]">
          <div className="py-1">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`group flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 ${
                    isActive
                      ? "bg-slate-50 font-medium text-slate-800 dark:bg-[#252525] dark:text-[#f1f1f1]"
                      : "text-slate-600 hover:bg-orange-500 hover:text-white dark:text-[#d1d5db] dark:hover:bg-orange-500 dark:hover:text-white"
                  }`}
                >
                  <Check
                    className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                      isActive ? "opacity-100 text-orange-500 group-hover:text-white dark:text-orange-400" : "opacity-0"
                    }`}
                  />
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

// ── Filter bar ────────────────────────────────────────────────────────────────
export function RideFiltersBar({
  cities,
  initialSearch,
  initialStatus,
}: {
  cities: { id: string; name: string }[];
  initialSearch?: string;
  initialStatus?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [city, setCity] = useState("");

  function navigate(overrides?: { status?: string; city?: string }) {
    const st = overrides?.status ?? status;
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (st && st !== "") params.set("status", st);
    const qs = params.toString();
    router.push(`/ride-operations${qs ? `?${qs}` : ""}`);
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
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      {/* Search */}
      <div className="relative min-w-[280px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && navigate()}
          placeholder="Search by ride ID, rider, driver..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition-all duration-150 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 dark:border-[#333] dark:bg-[#252525] dark:text-[#f1f1f1] dark:placeholder:text-[#555]"
        />
      </div>

      {/* City */}
      <FilterSelect
        icon={<MapPin className="h-4 w-4" />}
        value={city}
        onChange={(val) => setCity(val)}
        options={cityOptions}
        placeholder="All Cities"
      />

      {/* Status */}
      <FilterSelect
        icon={<SlidersHorizontal className="h-4 w-4" />}
        value={status}
        onChange={(val) => {
          setStatus(val);
          navigate({ status: val });
        }}
        options={statusOptions}
        placeholder="All Statuses"
      />
    </div>
  );
}
