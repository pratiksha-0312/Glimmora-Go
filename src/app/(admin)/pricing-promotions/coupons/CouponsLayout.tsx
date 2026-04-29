"use client";

import { useState } from "react";
import { CouponTable } from "./CouponTable";
import { CouponForm } from "./CouponForm";

export type SelectedCoupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: "FLAT" | "PERCENT";
  amount: number;
  usageLimit: number | null;
  usedCount: number;
  validUntil: string;
  active: boolean;
};

export function CouponsLayout({
  coupons,
  canWrite,
}: {
  coupons: SelectedCoupon[];
  canWrite: boolean;
}) {
  const [selected, setSelected] = useState<SelectedCoupon | null>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <CouponTable
          coupons={coupons}
          canWrite={canWrite}
          onSelect={setSelected}
          selectedId={selected?.id ?? null}
        />
      </div>
      {canWrite && (
        <div className="xl:col-span-1">
          <CouponForm
            selectedCoupon={selected}
            onDeselect={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}
