"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  ChevronDown,
  Clock,
  Globe,
  HelpCircle,
  Search,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/rbac";
import { ColorThemePicker } from "./ColorThemePicker";
import type { AdminRole } from "../../generated/prisma";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useSosCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/sos");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCount(data.count ?? 0);
      } catch {
        // ignore
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  return count;
}

export function Header({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: AdminRole;
}) {
  const now = useNow();
  const sosCount = useSosCount();

  const dateText = now
    ? now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const timeText = now
    ? now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const pillBase =
    "inline-flex h-9 items-center gap-2 rounded-full border border-[color:var(--brand-sand-border)] bg-white px-3 text-sm text-[color:var(--brand-text)] shadow-sm";

  return (
    <header className="flex h-16 items-center gap-3 border-b border-[color:var(--brand-sand-border)] bg-white px-6 font-sans">
      <div className={pillBase}>
        <Calendar className="h-4 w-4 text-[color:var(--brand-500)]" />
        <span className="text-xs font-medium text-[color:var(--brand-text-muted)]">Date</span>
        <span className="font-medium">{dateText}</span>
      </div>

      <div className={pillBase}>
        <Clock className="h-4 w-4 text-[color:var(--brand-500)]" />
        <span className="text-xs font-medium text-[color:var(--brand-text-muted)]">Time</span>
        <span className="font-medium">{timeText}</span>
      </div>

      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--brand-text-soft)]" />
        <input
          type="text"
          placeholder="Search..."
          className="h-9 w-full rounded-full border border-[color:var(--brand-sand-border)] bg-white pl-9 pr-16 text-sm text-[color:var(--brand-text)] placeholder:text-[color:var(--brand-text-soft)] shadow-sm outline-none transition focus:border-[color:var(--brand-500)] focus:ring-2 focus:ring-[color:var(--brand-500)]/20"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[color:var(--brand-sand-border)] bg-[color:var(--brand-cream-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--brand-text-muted)]">
          Ctrl K
        </span>
      </div>

      <ColorThemePicker />

      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--brand-sand-border)] bg-white px-3 text-sm font-medium text-[color:var(--brand-text)] shadow-sm transition hover:bg-[color:var(--brand-cream-hover)]"
      >
        <Globe className="h-4 w-4 text-[color:var(--brand-500)]" />
        EN
        <ChevronDown className="h-3.5 w-3.5 text-[color:var(--brand-text-soft)]" />
      </button>

      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--brand-sand-border)] bg-white px-3 text-sm font-medium text-[color:var(--brand-text)] shadow-sm transition hover:bg-[color:var(--brand-cream-hover)]"
      >
        <HelpCircle className="h-4 w-4 text-[color:var(--brand-500)]" />
        Help
      </button>

      <button
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--brand-sand-border)] bg-white text-[color:var(--brand-text)] shadow-sm transition hover:bg-[color:var(--brand-cream-hover)]"
      >
        <Bell className="h-4 w-4 text-[color:var(--brand-500)]" />
        {sosCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {sosCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2 pl-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--brand-500)] text-xs font-semibold text-white">
          {initials || "A"}
        </div>
        <div className="hidden flex-col leading-tight md:flex">
          <span className="text-sm font-semibold text-[color:var(--brand-text)]">{name}</span>
          <span className="text-[11px] text-[color:var(--brand-text-soft)]" title={email}>
            {ROLE_LABELS[role]}
          </span>
        </div>
      </div>
    </header>
  );
}
