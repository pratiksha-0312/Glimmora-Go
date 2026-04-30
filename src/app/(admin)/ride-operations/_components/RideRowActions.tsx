"use client";

import { useState } from "react";
import { Eye, Share2 } from "lucide-react";
import type { RideStatus } from "../../../../../generated/prisma";

export function RideRowActions({
  id,
  status: _status,
  cityDrivers: _cityDrivers,
  currentDriverId: _currentDriverId,
  riderPhone: _riderPhone,
}: {
  id: string;
  status: RideStatus;
  cityDrivers: { id: string; name: string; phone: string }[];
  currentDriverId: string | null;
  riderPhone?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function share() {
    setLoading(true);
    try {
      const res = await fetch(`/api/rides/${id}/token`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const url = `${window.location.origin}/track/${data.token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const iconBtn =
    "flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#252525] dark:hover:text-[#9ca3af]";

  return (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" title="View ride" className={iconBtn}>
        <Eye className="h-4 w-4" />
      </button>

      <button
        type="button"
        title={copied ? "Link copied!" : "Copy tracking link"}
        onClick={share}
        disabled={loading}
        className={`${iconBtn} ${copied ? "text-green-500" : ""}`}
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}
