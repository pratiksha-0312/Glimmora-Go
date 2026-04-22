"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReferralRowActions({
  id,
  rewardIssued,
  refereeJoined,
}: {
  id: string;
  rewardIssued: boolean;
  refereeJoined: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, key: string) {
    setLoading(key);
    try {
      await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex justify-end gap-3 text-xs font-medium">
      {!refereeJoined && (
        <button
          onClick={() => patch({ refereeJoined: true }, "join")}
          disabled={!!loading}
          className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {loading === "join" ? "…" : "Mark joined"}
        </button>
      )}
      {rewardIssued ? (
        <button
          onClick={() => patch({ rewardIssued: false }, "revoke")}
          disabled={!!loading}
          className="text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {loading === "revoke" ? "…" : "Revoke reward"}
        </button>
      ) : (
        <button
          onClick={() => patch({ rewardIssued: true }, "issue")}
          disabled={!!loading}
          className="text-green-600 hover:text-green-700 disabled:opacity-50"
        >
          {loading === "issue" ? "…" : "Issue reward"}
        </button>
      )}
    </div>
  );
}
