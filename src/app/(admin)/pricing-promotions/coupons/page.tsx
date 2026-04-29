import { prisma } from "@/lib/db";
import { Ticket, CheckCircle, Clock, BarChart2 } from "lucide-react";
import { CouponsLayout } from "./CouponsLayout";
import { requireAccess, sessionCanWrite } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getCoupons() {
  try {
    return await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
}

export default async function CouponsPage() {
  const session = await requireAccess("coupons");
  const canWrite = sessionCanWrite(session, "coupons");
  const coupons = await getCoupons();

  const now = new Date();
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.active && new Date(c.validUntil) >= now).length;
  const expiredCoupons = coupons.filter((c) => new Date(c.validUntil) < now).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  const stats = [
    { label: "Total Coupons", value: totalCoupons, icon: Ticket, iconBg: "bg-orange-50", iconText: "text-orange-500" },
    { label: "Active Coupons", value: activeCoupons, icon: CheckCircle, iconBg: "bg-green-50", iconText: "text-green-600" },
    { label: "Expired Coupons", value: expiredCoupons, icon: Clock, iconBg: "bg-red-50", iconText: "text-rose-500" },
    { label: "Total Redemptions", value: totalRedemptions.toLocaleString("en-IN"), icon: BarChart2, iconBg: "bg-blue-50", iconText: "text-blue-600" },
  ];

  const serializedCoupons = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType as "FLAT" | "PERCENT",
    amount: c.amount,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    validUntil: c.validUntil.toISOString(),
    active: c.active,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Coupons</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Create and manage promo codes for rider acquisition
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {s.label}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {s.value}
                </div>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.iconBg} ${s.iconText}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table + sidebar (shared selected state) ── */}
      <CouponsLayout coupons={serializedCoupons} canWrite={canWrite} />
    </div>
  );
}
