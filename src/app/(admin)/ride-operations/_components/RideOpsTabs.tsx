import Link from "next/link";

const TABS = [
  { key: "all", label: "All Rides", href: "/ride-operations" },
  { key: "live", label: "Live Rides", href: "/ride-operations/live" },
  { key: "scheduled", label: "Scheduled", href: "/ride-operations/scheduled" },
  { key: "history", label: "History", href: "/ride-operations/history" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function RideOpsTabs({
  active,
  counts,
}: {
  active: TabKey;
  counts?: { all?: number; live?: number; scheduled?: number; history?: number };
}) {
  const countMap: Record<TabKey, number | undefined> = {
    all: counts?.all,
    live: counts?.live,
    scheduled: counts?.scheduled,
    history: counts?.history,
  };

  return (
    <div className="flex gap-1 border-b border-slate-100 dark:border-[#2a2a2a]">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const count = countMap[tab.key];
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-[#6b7280] dark:hover:text-[#9ca3af]"
            }`}
          >
            {tab.label}
            {count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive
                    ? "bg-orange-100 text-orange-600 dark:bg-orange-500/15"
                    : "bg-slate-100 text-slate-500 dark:bg-[#252525] dark:text-[#6b7280]"
                }`}
              >
                {count.toLocaleString("en-IN")}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
