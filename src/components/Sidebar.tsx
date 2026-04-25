"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  Banknote,
  Percent,
  Ticket,
  Share2,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Store,
  Wallet,
  FileSearch,
  Building2,
  ChevronDown,
  LogOut,
  Calendar,
  History,
  Activity,
  Settings,
  Shield,
  Tag,
  MapPin,
  Bell,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccess, ROLE_LABELS, type Surface } from "@/lib/rbac";
import type { AdminRole } from "../../generated/prisma";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Car;
  surface: Surface;
  matchView?: string; // optional ?view= value to consider this item active
  exact?: boolean;    // require exact pathname match (no prefix matching)
};
type NavGroup = {
  id: string;
  label: string;
  icon: typeof Activity;
  items: NavItem[];
};

// Nav structure mirrors the 8-module SOW layout:
// 1 Operations Dashboard, 2 Ride Operations, 3 Driver Operations,
// 4 Pricing & Promotions, 5 Safety Monitoring, 6 Partner Management,
// 7 Reports, 8 Configuration.
const GROUPS: NavGroup[] = [
  {
    id: "ops-dashboard",
    label: "Operations Dashboard",
    icon: LayoutDashboard,
    items: [
      { href: "/", label: "Command Center", icon: Activity, surface: "dashboard" },
    ],
  },
  {
    id: "ride-ops",
    label: "Ride Operations",
    icon: Car,
    items: [
      { href: "/rides?view=live", label: "Live Rides", icon: Activity, surface: "rides", matchView: "live" },
      { href: "/rides?view=scheduled", label: "Scheduled Rides", icon: Calendar, surface: "rides", matchView: "scheduled" },
      { href: "/rides?view=history", label: "Ride History", icon: History, surface: "rides", matchView: "history" },
    ],
  },
  {
    id: "driver-ops",
    label: "Driver Operations",
    icon: Users,
    items: [
      { href: "/drivers", label: "Driver List", icon: Users, surface: "drivers" },
      { href: "/drivers?status=PENDING", label: "Verification & Documents", icon: ShieldCheck, surface: "drivers" },
      { href: "/subscriptions", label: "Subscriptions", icon: Wallet, surface: "subscriptions" },
      { href: "/referrals", label: "Driver Referrals", icon: Share2, surface: "referrals" },
    ],
  },
  {
    id: "pricing",
    label: "Pricing & Promotions",
    icon: Banknote,
    items: [
      { href: "/fares", label: "Fare Configuration", icon: Banknote, surface: "fares" },
      { href: "/concessions", label: "Concession Pricing", icon: Percent, surface: "concessions" },
      { href: "/coupons", label: "Coupons", icon: Ticket, surface: "coupons" },
      { href: "/cities", label: "City Pricing Rules", icon: MapPin, surface: "cities" },
    ],
  },
  {
    id: "safety",
    label: "Safety Monitoring",
    icon: Shield,
    items: [
      { href: "/sos", label: "SOS Alerts", icon: AlertTriangle, surface: "sos" },
      { href: "/tracking", label: "Ride Share Tracking", icon: MapPin, surface: "tracking" },
    ],
  },
  {
    id: "partners",
    label: "Partner Management",
    icon: Store,
    items: [
      { href: "/partners", label: "Partner List", icon: Store, surface: "partners" },
      { href: "/corporates", label: "Enterprise", icon: Building2, surface: "corporates" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, surface: "reports" },
    ],
  },
  {
    id: "config",
    label: "Configuration",
    icon: Settings,
    items: [
      { href: "/cities", label: "City Archetype", icon: Tag, surface: "cities" },
      { href: "/admins", label: "Admin Users", icon: ShieldCheck, surface: "admins", exact: true },
      { href: "/admins/roles", label: "Roles & Permissions", icon: KeyRound, surface: "admins" },
      { href: "/notifications", label: "Notification Logs", icon: Bell, surface: "notifications" },
      { href: "/audit", label: "Audit Logs", icon: FileSearch, surface: "audit" },
    ],
  },
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

function pathnameOf(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

function isItemActive(
  item: NavItem,
  pathname: string,
  view: string | null
): boolean {
  const target = pathnameOf(item.href);
  if (target === "/") {
    return pathname === "/";
  }
  // For /rides items with explicit matchView, require both pathname + view match.
  if (item.matchView !== undefined) {
    return pathname === "/rides" && view === item.matchView;
  }
  // For /rides without matchView, only match when no view is set — avoids
  // every Ride Operations item lighting up when one is active.
  if (target === "/rides") {
    return pathname === "/rides" && !view;
  }
  if (item.exact) {
    return pathname === target;
  }
  return pathname === target || pathname.startsWith(target + "/");
}

export function Sidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view");
  const router = useRouter();
  const sosCount = useSosCount(canAccess(role, "sos"));

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => canAccess(role, it.surface)),
  })).filter((g) => g.items.length > 0);

  const activeGroupId =
    visibleGroups.find((g) =>
      g.items.some((it) => isItemActive(it, pathname, view))
    )?.id ?? visibleGroups[0]?.id;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    [activeGroupId ?? ""]: true,
  }));

  useEffect(() => {
    if (activeGroupId) setExpanded((e) => ({ ...e, [activeGroupId]: true }));
  }, [activeGroupId]);

  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#f0e4d6] bg-white font-sans">
      <Link
        href="/"
        className="flex h-16 items-center gap-3 border-b border-[#f0e4d6] px-5"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="Glimmora Go" className="h-8 w-8 rounded-md object-contain" />
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold text-[#3a2d28]">Glimmora Go</span>
          <span className="text-[10px] uppercase tracking-wider text-[#a89485]">
            {ROLE_LABELS[role]}
          </span>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleGroups.map((group) => {
          // The dashboard group has only one item — render as a flat link, no chevron.
          if (group.id === "ops-dashboard") {
            const item = group.items[0];
            const active = isItemActive(item, pathname, view);
            const Icon = group.icon;
            return (
              <Link
                key={group.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-[#f3e8db] text-[#3a2d28]"
                    : "text-[#3a2d28] hover:bg-[#fbf5ef]"
                )}
              >
                <Icon className="h-4 w-4 text-[#6b5349]" />
                {group.label}
              </Link>
            );
          }

          // Single-item groups (Reports) also render flat for clarity.
          if (group.items.length === 1) {
            const item = group.items[0];
            const active = isItemActive(item, pathname, view);
            const Icon = group.icon;
            return (
              <Link
                key={group.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-[#f3e8db] text-[#3a2d28]"
                    : "text-[#3a2d28] hover:bg-[#fbf5ef]"
                )}
              >
                <Icon className="h-4 w-4 text-[#6b5349]" />
                {group.label}
              </Link>
            );
          }

          const isExpanded = !!expanded[group.id];
          const isActiveGroup = group.id === activeGroupId;
          const GroupIcon = group.icon;
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() =>
                  setExpanded((e) => ({ ...e, [group.id]: !e[group.id] }))
                }
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActiveGroup
                    ? "bg-[#f3e8db] text-[#3a2d28]"
                    : "text-[#3a2d28] hover:bg-[#fbf5ef]"
                )}
              >
                <span className="flex items-center gap-3">
                  <GroupIcon className="h-4 w-4 text-[#6b5349]" />
                  {group.label}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[#a89485] transition-transform",
                    isExpanded ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>

              {isExpanded && (
                <div className="mt-1 space-y-0.5 pl-3">
                  {group.items.map((it) => {
                    const active = isItemActive(it, pathname, view);
                    const isSos = it.surface === "sos";
                    const showBadge = isSos && sosCount > 0;
                    const Icon = it.icon;
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition",
                          active
                            ? "bg-[#f0e4d6] font-medium text-[#3a2d28]"
                            : "font-normal text-[#6b5349] hover:bg-[#fbf5ef] hover:text-[#3a2d28]"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              isSos && sosCount > 0
                                ? "text-red-600"
                                : active
                                ? "text-[#a57865]"
                                : "text-[#a89485]"
                            )}
                          />
                          {it.label}
                        </span>
                        {showBadge && (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                            {sosCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#3a2d28] transition hover:bg-[#fbf5ef] disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 text-[#6b5349]" />
          {loggingOut ? "Logging out..." : "Log Out"}
        </button>
      </nav>

      <div className="flex items-center justify-between border-t border-[#f0e4d6] px-4 py-3">
        <span className="text-[11px] text-[#a89485]">
          © {new Date().getFullYear()} Glimmora Go
        </span>
        <span className="rounded-md border border-[#f0e4d6] bg-[#fbf5ef] px-1.5 py-0.5 text-[10px] font-medium text-[#a57865]">
          v1.0
        </span>
      </div>
    </aside>
  );
}
