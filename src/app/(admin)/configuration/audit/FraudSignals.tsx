import { prisma } from "@/lib/db";

type Signal = {
  label: string;
  count: number;
  detail: string;
  severity: "high" | "medium" | "low";
};

async function computeSignals(): Promise<Signal[]> {
  const signals: Signal[] = [];

  try {
    // 1. Stale PENDING drivers (>14 days)
    const staleCutoff = new Date();
    staleCutoff.setDate(staleCutoff.getDate() - 14);
    const stalePending = await prisma.driver.count({
      where: { status: "PENDING", createdAt: { lt: staleCutoff } },
    });
    signals.push({
      label: "Stale driver applications",
      count: stalePending,
      detail: "PENDING for more than 14 days",
      severity: stalePending > 5 ? "high" : stalePending > 0 ? "medium" : "low",
    });

    // 2. Drivers with 2+ REJECTED documents
    const rejectedGroups = await prisma.driverDocument.groupBy({
      by: ["driverId"],
      where: { status: "REJECTED" },
      _count: { _all: true },
      having: { driverId: { _count: { gte: 2 } } },
    });
    signals.push({
      label: "Drivers with repeated doc rejections",
      count: rejectedGroups.length,
      detail: "Two or more REJECTED documents — possible forged identity",
      severity:
        rejectedGroups.length > 3
          ? "high"
          : rejectedGroups.length > 0
            ? "medium"
            : "low",
    });

    // 3. Unreviewed SOS rides (>24h old, still flagged)
    const sosCutoff = new Date();
    sosCutoff.setHours(sosCutoff.getHours() - 24);
    const openSOS = await prisma.ride.count({
      where: { sosTriggered: true, createdAt: { lt: sosCutoff } },
    });
    signals.push({
      label: "Unresolved SOS older than 24h",
      count: openSOS,
      detail: "Safety incidents that haven't been followed up",
      severity: openSOS > 0 ? "high" : "low",
    });

    // 4. Duplicate rider accounts (same name, different phone)
    const nameGroups = await prisma.rider.groupBy({
      by: ["name"],
      where: { name: { not: null } },
      _count: { _all: true },
      having: { name: { _count: { gt: 1 } } },
    });
    signals.push({
      label: "Possible duplicate rider accounts",
      count: nameGroups.length,
      detail: "Same name across multiple phone numbers",
      severity:
        nameGroups.length > 5
          ? "medium"
          : nameGroups.length > 0
            ? "low"
            : "low",
    });

    // 5. High-cancellation drivers (>30% cancel rate, min 10 rides)
    const drivers = await prisma.driver.findMany({
      where: {
        rides: { some: {} },
      },
      select: {
        id: true,
        name: true,
        rides: { select: { status: true } },
      },
    });
    const suspicious = drivers.filter((d) => {
      if (d.rides.length < 10) return false;
      const cancelled = d.rides.filter((r) => r.status === "CANCELLED").length;
      return cancelled / d.rides.length > 0.3;
    });
    signals.push({
      label: "High-cancellation drivers",
      count: suspicious.length,
      detail: "Drivers with >30% cancel rate across 10+ rides",
      severity:
        suspicious.length > 2
          ? "high"
          : suspicious.length > 0
            ? "medium"
            : "low",
    });
  } catch {
    return [];
  }

  return signals;
}

function severityColor(sev: Signal["severity"]): string {
  if (sev === "high") return "border-red-200 bg-red-50";
  if (sev === "medium") return "border-amber-200 bg-amber-50";
  return "border-slate-200 bg-white";
}

function severityTextColor(sev: Signal["severity"]): string {
  if (sev === "high") return "text-red-700";
  if (sev === "medium") return "text-amber-700";
  return "text-slate-900";
}

export async function FraudSignals() {
  const signals = await computeSignals();
  if (signals.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Fraud & compliance signals
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {signals.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 shadow-sm ${severityColor(s.severity)}`}
          >
            <div className={`text-2xl font-bold ${severityTextColor(s.severity)}`}>
              {s.count}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {s.label}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">{s.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
