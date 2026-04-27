"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { rideStatusVariant } from "@/lib/format";
import { formatCurrency } from "@/lib/utils";
import type { RideStatus } from "../../../generated/prisma";

type LiveRide = {
  id: string;
  status: RideStatus;
  pickupAddress: string;
  dropAddress: string;
  fareEstimate: number;
  sosTriggered: boolean;
  createdAt: string;
  rider: { phone: string; name: string | null };
  driver: { name: string } | null;
  city: { name: string };
};

function ageMinutes(iso: string, now: number): number {
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
}

export function LiveRides({ initial }: { initial: LiveRide[] }) {
  const [rides, setRides] = useState<LiveRide[]>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch("/api/dashboard/live-rides", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setRides(data.rides);
          setStale(false);
        }
      } catch {
        if (!cancelled) setStale(true);
      }
    };
    const id = setInterval(refresh, 15_000);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
      clearInterval(tick);
    };
  }, []);

  return (
    <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <h2 className="text-sm font-semibold text-slate-900">Live rides</h2>
          <Badge variant="default">{rides.length}</Badge>
          {stale && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600">
              stale
            </span>
          )}
        </div>
        <Link
          href="/rides"
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          All rides →
        </Link>
      </div>

      {rides.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-slate-400">
          <Activity className="h-7 w-7 text-slate-300" />
          No rides in flight right now
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-2.5 text-left">Rider</th>
                <th className="px-5 py-2.5 text-left">Driver</th>
                <th className="px-5 py-2.5 text-left">City</th>
                <th className="px-5 py-2.5 text-left">Fare est.</th>
                <th className="px-5 py-2.5 text-left">Status</th>
                <th className="px-5 py-2.5 text-left">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rides.map((r) => {
                const age = ageMinutes(r.createdAt, now);
                const aged = age >= 10;
                return (
                  <tr
                    key={r.id}
                    className={
                      r.sosTriggered ? "bg-red-50/40" : "hover:bg-[#fbf7f2]"
                    }
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        {r.sosTriggered && (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">
                            {r.rider.name ?? "—"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {r.rider.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-slate-700">
                      {r.driver?.name ?? (
                        <span className="text-amber-600">Unmatched</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-slate-700">{r.city.name}</td>
                    <td className="px-5 py-2.5 font-medium text-slate-900">
                      {formatCurrency(r.fareEstimate)}
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge variant={rideStatusVariant(r.status)}>
                        {r.status}
                      </Badge>
                    </td>
                    <td
                      className={
                        "px-5 py-2.5 text-xs " +
                        (aged ? "font-semibold text-amber-700" : "text-slate-500")
                      }
                    >
                      {age}m
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
