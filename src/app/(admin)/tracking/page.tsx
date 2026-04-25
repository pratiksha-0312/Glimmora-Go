import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { rideStatusVariant } from "@/lib/format";
import { formatDate } from "@/lib/utils";
import { requireAccess } from "@/lib/auth";
import { RideStatus } from "../../../../generated/prisma";
import { Map, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { TrackingMapPanel } from "./TrackingMapPanel";

export const dynamic = "force-dynamic";

const IN_FLIGHT: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.MATCHED,
  RideStatus.EN_ROUTE,
  RideStatus.ARRIVED,
  RideStatus.IN_TRIP,
];

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ ride?: string }>;
}) {
  const session = await requireAccess("tracking");
  const sp = await searchParams;
  const cityFilter = session.cityId ? { cityId: session.cityId } : {};

  let rides: {
    id: string;
    status: RideStatus;
    pickupAddress: string;
    dropAddress: string;
    sosTriggered: boolean;
    trackingToken: string | null;
    createdAt: Date;
    cityId: string;
    rider: { name: string | null; phone: string };
    driver: { name: string } | null;
    city: { name: string };
  }[] = [];
  let dbError = false;
  try {
    rides = await prisma.ride.findMany({
      where: { ...cityFilter, status: { in: IN_FLIGHT } },
      orderBy: [{ sosTriggered: "desc" }, { createdAt: "desc" }],
      take: 30,
      select: {
        id: true,
        status: true,
        pickupAddress: true,
        dropAddress: true,
        sosTriggered: true,
        trackingToken: true,
        createdAt: true,
        cityId: true,
        rider: { select: { name: true, phone: true } },
        driver: { select: { name: true } },
        city: { select: { name: true } },
      },
    });
  } catch {
    dbError = true;
  }

  const selectedRideId = sp.ride
    ? rides.find((r) => r.id === sp.ride)?.id ?? rides[0]?.id ?? null
    : rides[0]?.id ?? null;

  return (
    <div>
      <PageHeader
        title="Ride Share Tracking"
        description="Watch any active ride on a map — SOS-flagged rides bubble to the top. Updates every 8 seconds."
      />

      {dbError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Database not reachable.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <aside className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                In-flight rides
              </h2>
              <Badge variant="default">{rides.length}</Badge>
            </div>
            {rides.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-slate-400">
                <Map className="h-7 w-7 text-slate-300" />
                No rides currently in flight
              </div>
            ) : (
              <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
                {rides.map((r) => {
                  const active = r.id === selectedRideId;
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/tracking?ride=${r.id}`}
                        className={
                          "block px-5 py-3 transition " +
                          (active
                            ? "bg-brand-50/70 ring-1 ring-inset ring-brand-200"
                            : r.sosTriggered
                              ? "bg-red-50/40 hover:bg-red-50"
                              : "hover:bg-slate-50")
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {r.sosTriggered && (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                            )}
                            <span className="text-sm font-medium text-slate-900">
                              {r.rider.name ?? r.rider.phone}
                            </span>
                          </div>
                          <Badge variant={rideStatusVariant(r.status)}>
                            {r.status}
                          </Badge>
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {r.pickupAddress} → {r.dropAddress}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {r.city.name} ·{" "}
                            {r.driver?.name ?? (
                              <span className="text-amber-600">Unmatched</span>
                            )}
                          </span>
                          <span>{formatDate(r.createdAt)}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="lg:col-span-3">
          {selectedRideId ? (
            <TrackingMapPanel rideId={selectedRideId} />
          ) : (
            <div className="flex h-[60vh] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
              Pick a ride from the list to see it on the map.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
