"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const TrackMap = dynamic(() => import("./TrackMap").then((m) => m.TrackMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">
      Loading map…
    </div>
  ),
});

type Point = { address: string; lat: number; lng: number };
type Driver = {
  name: string;
  phone: string;
  online: boolean;
  lat: number | null;
  lng: number | null;
} | null;

export type TrackData = {
  status: string;
  pickup: Point;
  drop: Point;
  city: string;
  driver: Driver;
};

const POLL_MS = 10_000;

function statusLabel(s: string) {
  switch (s) {
    case "REQUESTED":
      return "Waiting for a driver…";
    case "MATCHED":
      return "Driver assigned — heading to pickup";
    case "EN_ROUTE":
      return "Driver is on the way";
    case "ARRIVED":
      return "Driver has arrived at pickup";
    case "IN_TRIP":
      return "Ride in progress";
    case "COMPLETED":
      return "Ride completed";
    case "CANCELLED":
      return "Ride cancelled";
    default:
      return s;
  }
}

function statusColor(s: string) {
  if (s === "COMPLETED") return "bg-green-600";
  if (s === "CANCELLED") return "bg-red-600";
  if (s === "IN_TRIP") return "bg-blue-600";
  if (s === "EN_ROUTE" || s === "ARRIVED" || s === "MATCHED")
    return "bg-amber-500";
  return "bg-slate-500";
}

export function TrackView({
  token,
  initial,
}: {
  token: string;
  initial: TrackData;
}) {
  const [data, setData] = useState<TrackData>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data.status === "COMPLETED" || data.status === "CANCELLED") return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/track/${token}`, { cache: "no-store" });
        if (!res.ok) {
          setError("Link no longer valid");
          return;
        }
        const next = await res.json();
        if (!cancelled) setData(next);
      } catch {
        // keep previous
      }
    };
    const id = setInterval(fetchData, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, data.status]);

  const terminal = data.status === "COMPLETED" || data.status === "CANCELLED";

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-xs font-black text-white">
              GG
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Glimmora Go
              </div>
              <div className="text-[11px] text-slate-500">Live ride tracking</div>
            </div>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ${statusColor(
              data.status
            )}`}
          >
            {data.status}
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-4xl flex-1 gap-4 px-4 py-4 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="h-[60vh] min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-full">
            <TrackMap data={data} />
          </div>
        </section>

        <aside className="space-y-3 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Status
            </div>
            <div className="mt-1 text-base font-semibold text-slate-900">
              {statusLabel(data.status)}
            </div>
            {error && (
              <div className="mt-2 text-xs text-red-600">{error}</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Driver
            </div>
            {data.driver ? (
              <div className="mt-1 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {data.driver.name}
                </div>
                <a
                  href={`tel:${data.driver.phone}`}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  {data.driver.phone}
                </a>
                <div className="text-[11px] text-slate-500">
                  {data.driver.online ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Online
                    </span>
                  ) : (
                    <span>Offline</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm text-slate-400">Not yet assigned</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Route
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Pickup
                  </div>
                  <div className="text-slate-900">{data.pickup.address}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Drop
                  </div>
                  <div className="text-slate-900">{data.drop.address}</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {data.city}
            </div>
          </div>

          {terminal && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              This ride has {data.status.toLowerCase()}. Live updates have stopped.
            </div>
          )}
        </aside>
      </main>

      <footer className="border-t border-slate-200 bg-white py-3 text-center text-[11px] text-slate-400">
        Shared via Glimmora Go · view only
      </footer>
    </div>
  );
}
