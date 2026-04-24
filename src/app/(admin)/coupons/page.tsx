import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { CouponForm } from "./CouponForm";
import { CouponRowActions } from "./CouponRowActions";
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

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Create and manage promo codes for rider acquisition"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {canWrite && (
          <div className="lg:col-span-1">
            <CouponForm />
          </div>
        )}

        <div className={canWrite ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                All Coupons
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Code</th>
                    <th className="px-5 py-3 text-left">Discount</th>
                    <th className="px-5 py-3 text-left">Usage</th>
                    <th className="px-5 py-3 text-left">Expires</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    {canWrite && (
                      <th className="px-5 py-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canWrite ? 6 : 5}
                        className="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        No coupons yet{canWrite ? ". Create one on the left." : "."}
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => {
                      const expired = new Date(c.validUntil) < new Date();
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono text-sm font-semibold text-slate-900">
                            {c.code}
                          </td>
                          <td className="px-5 py-3 text-slate-700">
                            {c.discountType === "FLAT"
                              ? `₹${c.amount} off`
                              : `${c.amount}% off`}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600">
                            {c.usedCount} /{" "}
                            {c.usageLimit ? c.usageLimit : "∞"}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {formatDate(c.validUntil)}
                          </td>
                          <td className="px-5 py-3">
                            {!c.active ? (
                              <Badge variant="default">Disabled</Badge>
                            ) : expired ? (
                              <Badge variant="danger">Expired</Badge>
                            ) : (
                              <Badge variant="success">Active</Badge>
                            )}
                          </td>
                          {canWrite && (
                            <td className="px-5 py-3 text-right">
                              <CouponRowActions
                                id={c.id}
                                active={c.active}
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
