"use client";

<<<<<<< HEAD
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
    "inline-flex h-9 items-center gap-2 rounded-full border border-[#f0e4d6] bg-white px-3 text-sm text-[#3a2d28] shadow-sm";
=======
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Bell, Globe, ChevronDown, LogOut, Settings, Clock,
} from "lucide-react";
import type { AdminRole } from "../../generated/prisma";
import { useNotificationStore } from "@/store/notificationStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function formatRole(role: AdminRole): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "HI", label: "हिन्दी" },
];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-3.5 w-3.5 text-slate-400" />
      <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">{time}</span>
      <span className="hidden text-slate-400 dark:text-slate-500 sm:inline">·</span>
      <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">{date}</span>
    </div>
  );
}

export function Header({ name, role }: { name: string; role: AdminRole }) {
  const router = useRouter();

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const [lang, setLang] = useState("EN");
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
>>>>>>> fff2399 (Dashboard and coupons page UI enhancement)

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
<<<<<<< HEAD
    <header className="flex h-16 items-center gap-3 border-b border-[#f0e4d6] bg-white px-6 font-sans">
      <div className={pillBase}>
        <Calendar className="h-4 w-4 text-[#a57865]" />
        <span className="text-xs font-medium text-[#6b5349]">Date</span>
        <span className="font-medium">{dateText}</span>
      </div>

      <div className={pillBase}>
        <Clock className="h-4 w-4 text-[#a57865]" />
        <span className="text-xs font-medium text-[#6b5349]">Time</span>
        <span className="font-medium">{timeText}</span>
      </div>

      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a89485]" />
        <input
          type="text"
          placeholder="Search..."
          className="h-9 w-full rounded-full border border-[#f0e4d6] bg-white pl-9 pr-16 text-sm text-[#3a2d28] placeholder:text-[#b9a496] shadow-sm outline-none transition focus:border-[#a57865] focus:ring-2 focus:ring-[#a57865]/20"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#f0e4d6] bg-[#fbf5ef] px-1.5 py-0.5 text-[10px] font-medium text-[#6b5349]">
          Ctrl K
        </span>
      </div>

      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#f0e4d6] bg-white px-3 text-sm font-medium text-[#3a2d28] shadow-sm transition hover:bg-[#fbf5ef]"
      >
        <Globe className="h-4 w-4 text-[#a57865]" />
        EN
        <ChevronDown className="h-3.5 w-3.5 text-[#a89485]" />
      </button>

      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#f0e4d6] bg-white px-3 text-sm font-medium text-[#3a2d28] shadow-sm transition hover:bg-[#fbf5ef]"
      >
        <HelpCircle className="h-4 w-4 text-[#a57865]" />
        Help
      </button>

      <button
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f0e4d6] bg-white text-[#3a2d28] shadow-sm transition hover:bg-[#fbf5ef]"
      >
        <Bell className="h-4 w-4 text-[#a57865]" />
        {sosCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {sosCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2 pl-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a57865] text-xs font-semibold text-white">
          {initials || "A"}
        </div>
        <div className="hidden flex-col leading-tight md:flex">
          <span className="text-sm font-semibold text-[#3a2d28]">{name}</span>
          <span className="text-[11px] text-[#a89485]" title={email}>
            {ROLE_LABELS[role]}
          </span>
        </div>
=======
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 shadow-[0_1px_2px_0_rgb(0,0,0,0.04)] dark:border-[#21262d] dark:bg-[#161b27]">

      {/* Live date & time */}
      <LiveClock />

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2">

        {/* Search */}
        <div className="flex w-60 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Search rides, drivers..."
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Notifications bell */}
        <button
          aria-label="Notifications"
          onClick={() => { markAllAsRead(); router.push("/notifications"); }}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Language selector */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Globe className="h-4 w-4" />
            <span>{lang}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {langOpen && (
            <div className="absolute right-0 top-11 z-50 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    l.code === lang
                      ? "font-semibold text-brand-600 dark:text-brand-400"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{l.label}</span>
                  <span className="text-xs text-slate-400">{l.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="text-left leading-tight">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatRole(role)}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => { setProfileOpen(false); router.push("/settings"); }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Admin Settings
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700" />
              <button
                onClick={logout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Logging out…" : "Log Out"}
              </button>
            </div>
          )}
        </div>
>>>>>>> fff2399 (Dashboard and coupons page UI enhancement)
      </div>
    </header>
  );
}
