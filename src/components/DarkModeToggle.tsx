"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "glimmora.darkMode";

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const on = localStorage.getItem(KEY) === "true";
    if (on) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function setMode(toDark: boolean) {
    if (toDark === dark) return;
    setDark(toDark);
    const html = document.documentElement;
    html.setAttribute("data-theme-switching", "");
    toDark ? html.classList.add("dark") : html.classList.remove("dark");
    localStorage.setItem(KEY, String(toDark));
    setTimeout(() => html.removeAttribute("data-theme-switching"), 400);
  }

  return (
    <div className="flex h-8 items-center gap-px rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      {/* Light */}
      <button
        type="button"
        onClick={() => setMode(false)}
        title="Light mode"
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
          !dark
            ? "bg-white shadow-sm text-orange-500 dark:bg-[#2a2a2a]"
            : "text-slate-400 hover:text-slate-500 dark:text-[#555] dark:hover:text-[#888]"
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>

      {/* Dark */}
      <button
        type="button"
        onClick={() => setMode(true)}
        title="Dark mode"
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
          dark
            ? "bg-[#1c1c1c] shadow-sm text-indigo-400 border border-[#333]"
            : "text-slate-400 hover:text-slate-500"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
