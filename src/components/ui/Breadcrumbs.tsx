import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-slate-500"
    >
      <Home className="h-3.5 w-3.5 text-slate-400" />
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {c.href && !last ? (
              <Link
                href={c.href}
                className="hover:text-[#a57865] hover:underline"
              >
                {c.label}
              </Link>
            ) : (
              <span className={last ? "font-medium text-slate-700" : undefined}>
                {c.label}
              </span>
            )}
            {!last && <ChevronRight className="h-3 w-3 text-slate-400" />}
          </span>
        );
      })}
    </nav>
  );
}
