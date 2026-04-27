"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  User,
  Banknote,
  Percent,
  Ticket,
  MapPin,
  Share2,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Store,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccess, ROLE_LABELS, type Surface } from "@/lib/rbac";
import type { AdminRole } from "../../generated/prisma";

const NAV: { href: string; label: string; icon: typeof Car; surface: Surface }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, surface: "dashboard" },
  { href: "/rides", label: "Rides", icon: Car, surface: "rides" },
  { href: "/sos", label: "SOS Alerts", icon: AlertTriangle, surface: "sos" },
  { href: "/drivers", label: "Drivers", icon: Users, surface: "drivers" },
  { href: "/riders", label: "Riders", icon: User, surface: "riders" },
  { href: "/partners", label: "Kirana Partners", icon: Store, surface: "partners" },
  { href: "/fares", label: "Fares", icon: Banknote, surface: "fares" },
  { href: "/concessions", label: "Concessions", icon: Percent, surface: "concessions" },
  { href: "/coupons", label: "Coupons", icon: Ticket, surface: "coupons" },
  { href: "/cities", label: "Cities", icon: MapPin, surface: "cities" },
  { href: "/referrals", label: "Referrals", icon: Share2, surface: "referrals" },
  { href: "/reports", label: "Reports", icon: BarChart3, surface: "reports" },
  { href: "/admins", label: "Admins", icon: ShieldCheck, surface: "admins" },
  { href: "/notifications", label: "Notifications", icon: Bell, surface: "dashboard" },
];

function useSosCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/sos");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCount(data.count ?? 0);
      } catch {
        // ignore
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled]);
  return count;
}

export function Sidebar({
  role,
  collapsed,
  onToggle,
}: {
  role: AdminRole;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((n) => canAccess(role, n.surface));
  const sosCount = useSosCount(canAccess(role, "sos"));

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-200 bg-white dark:border-[#21262d] dark:bg-[#0d1117] transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-3 dark:border-[#21262d]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-black text-white">
          GG
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              Glimmora Go
            </div>
            <div className="truncate text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {ROLE_LABELS[role]}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-2">
        {/* Collapse toggle — top of nav */}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mb-1 flex w-full items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-[#21262d] dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
            collapsed ? "justify-center" : "gap-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium">Collapse Menu</span>
            </>
          )}
        </button>

        {items.map(({ href, label, icon: Icon, surface }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isSos = surface === "sos";
          const showBadge = isSos && sosCount > 0;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                active
                  ? "bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              <span className="relative flex shrink-0 items-center">
                <Icon className={cn("h-4 w-4", isSos && sosCount > 0 && "text-red-500")} />
                {showBadge && collapsed && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {sosCount > 9 ? "9+" : sosCount}
                  </span>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {showBadge && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {sosCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
