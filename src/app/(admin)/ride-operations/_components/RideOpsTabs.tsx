import { PageTabs } from "@/components/ui/Tabs";

const TAB_DEFS = [
  { label: "All Rides", href: "/ride-operations" },
  { label: "Live Rides", href: "/ride-operations/live" },
  { label: "Scheduled", href: "/ride-operations/scheduled" },
  { label: "History", href: "/ride-operations/history" },
] as const;

type TabKey = "all" | "live" | "scheduled" | "history";

const ACTIVE_HREF: Record<TabKey, string> = {
  all: "/ride-operations",
  live: "/ride-operations/live",
  scheduled: "/ride-operations/scheduled",
  history: "/ride-operations/history",
};

export function RideOpsTabs({ active }: { active: TabKey }) {
  return (
    <PageTabs
      tabs={TAB_DEFS.map((t) => ({
        label: t.label,
        href: t.href,
        active: t.href === ACTIVE_HREF[active],
      }))}
    />
  );
}
