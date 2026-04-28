"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeId =
  | "terracotta"
  | "ocean-blue"
  | "forest-green"
  | "royal-purple"
  | "slate-gray"
  | "crimson-red"
  | "teal"
  | "amber-gold"
  | "indigo-navy"
  | "rose-pink"
  | "orange"
  | "emerald"
  | "coffee-brown"
  | "sky-blue";

const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "terracotta", label: "Terracotta", swatch: "#a57865" },
  { id: "ocean-blue", label: "Ocean Blue", swatch: "#4a7fa8" },
  { id: "forest-green", label: "Forest Green", swatch: "#4a8f6a" },
  { id: "royal-purple", label: "Royal Purple", swatch: "#7b68a5" },
  { id: "slate-gray", label: "Slate Gray", swatch: "#6b7b8d" },
  { id: "crimson-red", label: "Crimson Red", swatch: "#a5484a" },
  { id: "teal", label: "Teal", swatch: "#14b8a6" },
  { id: "amber-gold", label: "Amber Gold", swatch: "#d97706" },
  { id: "indigo-navy", label: "Indigo Navy", swatch: "#6366f1" },
  { id: "rose-pink", label: "Rose Pink", swatch: "#e11d48" },
  { id: "orange", label: "Orange", swatch: "#ea580c" },
  { id: "emerald", label: "Emerald", swatch: "#10b981" },
  { id: "coffee-brown", label: "Coffee Brown", swatch: "#8b6914" },
  { id: "sky-blue", label: "Sky Blue", swatch: "#0ea5e9" },
];

const STORAGE_KEY = "glimmora.theme";

function applyTheme(id: ThemeId) {
  if (id === "terracotta") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", id);
  }
}

export function ColorThemePicker() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ThemeId>("terracotta");
  const wrapRef = useRef<HTMLDivElement>(null);

  // Load saved theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) {
        setActive(saved);
        applyTheme(saved);
      }
    } catch {
      // ignore — localStorage may be unavailable
    }
  }, []);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function pick(id: ThemeId) {
    setActive(id);
    applyTheme(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  const activeTheme = THEMES.find((t) => t.id === active) ?? THEMES[0];

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Color Theme"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--brand-sand-border)] bg-white px-3 text-sm text-[color:var(--brand-text)] shadow-sm transition hover:bg-[color:var(--brand-cream)]"
      >
        <Palette className="h-4 w-4 text-[color:var(--brand-text-muted)]" />
        <span
          className="h-3 w-3 rounded-full"
          style={{ background: activeTheme.swatch }}
          aria-hidden
        />
        <ChevronDown className="h-3.5 w-3.5 text-[color:var(--brand-text-soft)]" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-[color:var(--brand-sand-border)] bg-white shadow-lg"
        >
          <div className="border-b border-[color:var(--brand-sand-border)] px-3 py-2 text-xs font-semibold text-[color:var(--brand-text)]">
            Color Theme
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {THEMES.map((t) => {
              const isActive = t.id === active;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => pick(t.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition",
                      isActive
                        ? "bg-[color:var(--brand-cream)] font-medium text-[color:var(--brand-text)]"
                        : "text-[color:var(--brand-text-muted)] hover:bg-[color:var(--brand-cream-hover)]"
                    )}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                      style={{ background: t.swatch }}
                      aria-hidden
                    />
                    <span className="flex-1">{t.label}</span>
                    {isActive && (
                      <Check className="h-3.5 w-3.5 text-[color:var(--brand-500)]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
