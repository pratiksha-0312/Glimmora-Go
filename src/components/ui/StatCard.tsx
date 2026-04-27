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
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
          {trend && (
            <div className="mt-1 text-xs text-slate-500">{trend}</div>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accents[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
