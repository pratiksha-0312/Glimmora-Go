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

export function Sidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => canAccess(role, n.surface));
  const sosCount = useSosCount(canAccess(role, "sos"));

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-black text-white">
          GG
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">Glimmora Go</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400">
            {ROLE_LABELS[role]}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon, surface }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isSos = surface === "sos";
          const showBadge = isSos && sosCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4", isSos && sosCount > 0 && "text-red-600")} />
                {label}
              </span>
              {showBadge && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                  {sosCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 text-[11px] text-slate-400">
        v1.0 · MVP
      </div>
    </aside>
  );
}
