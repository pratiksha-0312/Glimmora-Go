"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { TrackData } from "../../track/[token]/TrackView";

const TrackMap = dynamic(
  () => import("../../track/[token]/TrackMap").then((m) => m.TrackMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">
        Loading map…
      </div>
    ),
  }
);

type RideDetail = TrackData & {
  id: string;
  rider: { name: string | null; phone: string };
  sosTriggered: boolean;
};

const POLL_MS = 8_000;

export function TrackingMapPanel({ rideId }: { rideId: string }) {
  const [data, setData] = useState<RideDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/dashboard/tracking/${rideId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Failed to load ride");
          return;
        }
        if (!cancelled) {
          setData(json.ride);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOnce();
    const id = setInterval(() => {
      if (cancelled) return;
      // stop polling on terminal states
      if (
        data &&
        (data.status === "COMPLETED" || data.status === "CANCELLED")
      ) {
        return;
      }
      fetchOnce();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading ride…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
        {error ?? "Ride not found"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-2">
            {data.sosTriggered && (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span className="font-mono text-xs text-slate-500">
              {data.id.slice(0, 8)}
            </span>
            <span className="text-sm font-medium text-slate-900">
              {data.rider.name ?? data.rider.phone}
            </span>
            <span className="text-xs text-slate-500">· {data.city}</span>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {data.status}
          </span>
        </div>
        <div className="h-[60vh] min-h-[360px]">
          <TrackMap data={data} />
        </div>
      </div>
    </div>
  );
}
