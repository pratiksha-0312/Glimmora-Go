"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Plus, List, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/p", label: "Home", icon: Home, exact: true },
  { href: "/p/book", label: "Book", icon: Plus },
  { href: "/p/bookings", label: "History", icon: List },
  { href: "/p/profile", label: "Profile", icon: User },
];

export function PartnerNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-2xl justify-around px-2 py-2">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[11px] font-medium",
                active ? "text-brand-600" : "text-slate-500"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
