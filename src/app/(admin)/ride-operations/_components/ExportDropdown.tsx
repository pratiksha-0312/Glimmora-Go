"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Sheet, FileText } from "lucide-react";

export function ExportDropdown({ exportUrl }: { exportUrl: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function printPdf() {
    setOpen(false);
    setTimeout(() => window.print(), 100);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg border bg-white px-3.5 py-2 text-sm font-medium transition dark:bg-[#1a1a1a] ${
          open
            ? "border-slate-300 text-slate-700 dark:border-[#444] dark:text-[#d1d5db]"
            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-[#333] dark:text-[#9ca3af]"
        }`}
      >
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl dark:border-[#2a2a2a] dark:bg-[#1c1c1c]">
          <div className="py-1">
            <a
              href={exportUrl}
              download
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-orange-500 hover:text-white dark:text-[#d1d5db] dark:hover:bg-orange-500 dark:hover:text-white"
            >
              <Sheet className="h-4 w-4 shrink-0" />
              Download as Excel / CSV
            </a>
            <button
              type="button"
              onClick={printPdf}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-orange-500 hover:text-white dark:text-[#d1d5db] dark:hover:bg-orange-500 dark:hover:text-white"
            >
              <FileText className="h-4 w-4 shrink-0" />
              Download as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
