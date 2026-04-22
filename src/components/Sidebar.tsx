"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rides", label: "Rides", icon: Car },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/riders", label: "Riders", icon: User },
  { href: "/fares", label: "Fares", icon: Banknote },
  { href: "/concessions", label: "Concessions", icon: Percent },
  { href: "/coupons", label: "Coupons", icon: Ticket },
  { href: "/cities", label: "Cities", icon: MapPin },
  { href: "/referrals", label: "Referrals", icon: Share2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admins", label: "Admins", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-black text-white">
          GG
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">Glimmora Go</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400">
            Admin
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
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
