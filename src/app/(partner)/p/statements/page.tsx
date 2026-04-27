import { prisma } from "@/lib/db";
import { requirePartner } from "@/lib/partnerAuth";
import { accruedSince, formatPeriod, periodTotals } from "@/lib/payouts";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Banknote, CalendarDays, CalendarRange, Wallet } from "lucide-react";
import type { PayoutStatus } from "../../../../../generated/prisma";

function startOfWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // Treat Monday as first day of the week.
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

function startOfMonth(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

export const dynamic = "force-dynamic";

function payoutBadgeVariant(s: PayoutStatus) {
  switch (s) {
    case "PAID":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "FAILED":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export default async function PartnerStatementsPage() {
  const session = await requirePartner();

  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    select: { commissionPct: true },
  });
  const commissionPct = partner?.commissionPct ?? 10;

  const payouts = await prisma.payout.findMany({
    where: { partnerId: session.partnerId },
    orderBy: { periodEnd: "desc" },
  });

  const lastEnd = payouts[0]?.periodEnd ?? null;
  const accrued = await accruedSince(session.partnerId, lastEnd, commissionPct);

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [weekTotals, monthTotals] = await Promise.all([
    periodTotals(session.partnerId, weekStart, tomorrow),
    periodTotals(session.partnerId, monthStart, tomorrow),
  ]);
  const weekCommission = Math.round(
    (weekTotals.grossFare * commissionPct) / 100
  );
  const monthCommission = Math.round(
    (monthTotals.grossFare * commissionPct) / 100
  );

  const totalPaid = payouts
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
          <Wallet className="h-3.5 w-3.5" />
          Accrued (since last payout)
        </div>
        <div className="mt-1 text-2xl font-bold text-slate-900">
          {formatCurrency(accrued.amount)}
        </div>
        <div className="mt-0.5 text-[11px] text-slate-400">
          {accrued.rideCount} completed ride{accrued.rideCount === 1 ? "" : "s"}
          {" · "}
          {commissionPct}% commission
          {lastEnd ? ` · since ${formatDate(lastEnd)}` : " · all-time"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            This week
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(weekCommission)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {weekTotals.rideCount} ride{weekTotals.rideCount === 1 ? "" : "s"} · since{" "}
            {formatDate(weekStart)}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
            <CalendarRange className="h-3.5 w-3.5" />
            This month
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(monthCommission)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            {monthTotals.rideCount} ride{monthTotals.rideCount === 1 ? "" : "s"} · since{" "}
            {formatDate(monthStart)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            Total paid out
          </div>
          <div className="mt-1 text-lg font-bold text-green-700">
            {formatCurrency(totalPaid)}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            Pending
          </div>
          <div className="mt-1 text-lg font-bold text-amber-700">
            {formatCurrency(totalPending)}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Payout history</h3>
        </div>

        {payouts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-slate-400">
            <Banknote className="h-8 w-8 text-slate-300" />
            No payouts yet. Once an admin generates a payout for your bookings,
            it will appear here.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {payouts.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">
                      {formatPeriod(p.periodStart, p.periodEnd)}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {p.rideCount} ride{p.rideCount === 1 ? "" : "s"} · gross{" "}
                      {formatCurrency(p.grossFare)} · {p.commissionPct}%
                    </div>
                    {p.reference && (
                      <div className="mt-0.5 truncate text-[11px] text-slate-400">
                        Ref: {p.reference}
                      </div>
                    )}
                    {p.paidAt && (
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        Paid {formatDate(p.paidAt)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={payoutBadgeVariant(p.status)}>
                      {p.status}
                    </Badge>
                    <div className="text-base font-bold text-slate-900">
                      {formatCurrency(p.amount)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
