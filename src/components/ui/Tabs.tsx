"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  href: string;
  active: boolean;
};

export function PageTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <>
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "relative px-4 pb-2 pt-1 text-sm font-medium transition-colors",
            t.active
              ? "text-[color:var(--brand-text)]"
              : "text-slate-500 hover:text-[color:var(--brand-text)]"
          )}
        >
          {t.label}
          {t.active && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[color:var(--brand-500)]" />
          )}
        </Link>
      ))}
    </>
  );
}
