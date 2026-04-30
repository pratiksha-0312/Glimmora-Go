"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const INTERVAL_MS = 15_000;

export function AutoRefresh() {
  const router = useRouter();
  const [on, setOn] = useState(true);
  const [tick, setTick] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      router.refresh();
      setTick((t) => t + 1);
      setSpinning(true);
      setTimeout(() => setSpinning(false), 600);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [on, router]);

  function manualRefresh() {
    router.refresh();
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOn((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium transition hover:border-slate-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
      >
        <span className={`h-2 w-2 rounded-full ${on ? "bg-green-500 shadow-[0_0_4px_#22c55e]" : "bg-slate-300"}`} />
        <span className={on ? "text-slate-700 dark:text-[#d1d5db]" : "text-slate-400"}>
          {on ? `Live on · 15s${tick > 0 ? ` · ${tick}×` : ""}` : "Live off"}
        </span>
      </button>
      <button
        type="button"
        onClick={manualRefresh}
        title="Refresh now"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-orange-300 hover:text-orange-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:hover:text-orange-400"
      >
        <RefreshCw className={`h-3.5 w-3.5 transition-transform duration-500 ${spinning ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
