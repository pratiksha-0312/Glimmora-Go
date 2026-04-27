"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubscriptionRowActions({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (active && !confirm("Revoke this subscription?")) return;
    setLoading(true);
    await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={
        active
          ? "text-red-600 hover:text-red-700 disabled:opacity-50 text-xs font-medium"
          : "text-brand-600 hover:text-brand-700 disabled:opacity-50 text-xs font-medium"
      }
    >
      {active ? "Revoke" : "Reinstate"}
    </button>
  );
}
