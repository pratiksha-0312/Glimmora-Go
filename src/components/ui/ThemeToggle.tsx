"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, mounted, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={!mounted}
      className="relative flex h-8 w-14 shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 p-1 transition-colors duration-300 disabled:opacity-0 dark:border-slate-600 dark:bg-slate-700"
    >
      {/* Sliding knob */}
      <span
        className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out dark:bg-slate-900 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-blue-400" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>

      {/* Background icons */}
      <Sun className="h-3.5 w-3.5 text-amber-400/50 dark:text-slate-500" />
      <Moon className="ml-auto h-3.5 w-3.5 text-slate-400/50 dark:text-blue-400/50" />
    </button>
  );
}
