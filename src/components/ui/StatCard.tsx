import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: "brand" | "green" | "blue" | "red";
}) {
  const accents = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400",
    blue:  "bg-blue-50  text-blue-600  dark:bg-blue-950/60  dark:text-blue-400",
    red:   "bg-red-50   text-red-600   dark:bg-red-950/60   dark:text-red-400",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </div>
          {trend && (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{trend}</div>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
