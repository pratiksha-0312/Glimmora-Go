import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { CouponsClient, type CouponItem } from "./CouponsClient";

export const dynamic = "force-dynamic";

async function getCoupons(): Promise<CouponItem[]> {
  try {
    const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((c) => ({
      id:           c.id,
      code:         c.code,
      description:  c.description,
      discountType: c.discountType,
      amount:       c.amount,
      usageLimit:   c.usageLimit,
      usedCount:    c.usedCount,
      validUntil:   c.validUntil.toISOString(),
      active:       c.active,
    }));
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
      <CouponsClient coupons={coupons} canWrite={canWrite} />
    </div>
  );
}
