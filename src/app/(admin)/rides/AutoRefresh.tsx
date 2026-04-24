"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 15_000;

export function AutoRefresh() {
  const router = useRouter();
  const [on, setOn] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      router.refresh();
      setTick((t) => t + 1);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [on, router]);

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span>
        Live {on ? "on" : "off"}
        {on && (
          <span className="ml-1 text-slate-400">
            · 15s{tick > 0 ? ` · refreshed ${tick}×` : ""}
          </span>
        )}
      </span>
    </label>
  );
}
