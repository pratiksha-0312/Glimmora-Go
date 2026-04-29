import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { SparkLine } from "./SparkLine";

const accentMap = {
  brand: { iconBg: "bg-orange-50", iconText: "text-orange-500", sparkColor: "#f97316" },
  green: { iconBg: "bg-green-50", iconText: "text-green-600", sparkColor: "#10b981" },
  blue: { iconBg: "bg-blue-50", iconText: "text-blue-600", sparkColor: "#3b82f6" },
  red: { iconBg: "bg-rose-50", iconText: "text-rose-500", sparkColor: "#f43f5e" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "brand",
  sparkline,
  percentChange,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: "brand" | "green" | "blue" | "red";
  sparkline?: number[];
  percentChange?: number | null;
}) {
  const a = accentMap[accent];
  const gradId = `spark-grad-${accent}`;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {percentChange !== null && percentChange !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  percentChange > 0
                    ? "bg-green-50 text-green-700"
                    : percentChange < 0
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-50 text-slate-500"
                )}
              >
                {percentChange > 0 ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : percentChange < 0 ? (
                  <TrendingDown className="h-2.5 w-2.5" />
                ) : null}
                {percentChange > 0 ? "+" : ""}
                {percentChange}%
              </span>
            )}
            {trend && <span className="text-[11px] text-slate-400">{trend}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.iconBg, a.iconText)}>
            <Icon className="h-5 w-5" />
          </div>
          {sparkline && sparkline.length > 1 && (
            <SparkLine data={sparkline} color={a.sparkColor} gradId={gradId} />
          )}
        </div>
      </div>
    </div>
  );
}
