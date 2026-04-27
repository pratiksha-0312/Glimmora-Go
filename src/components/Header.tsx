"use client";

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

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
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
      </div>
    </header>
  );
}
