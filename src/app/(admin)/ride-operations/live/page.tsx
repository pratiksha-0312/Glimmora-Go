import { PageHeader } from "@/components/ui/PageHeader";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { AutoRefresh } from "../_components/AutoRefresh";
import { RidesTable } from "../_components/RidesTable";
import { RideOpsTabs } from "../_components/RideOpsTabs";
import { fetchRides, LIVE_STATUSES } from "../_components/queries";

export const dynamic = "force-dynamic";

export default async function LiveRidesPage() {
  const session = await requireAccess("rides");
  const canWrite = sessionCanWrite(session, "rides");
  const { rides, approvedDrivers } = await fetchRides({
    cityId: session.cityId,
    where: { status: { in: LIVE_STATUSES } },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Ride Operations" },
          { label: "Live Rides" },
        ]}
        title="Live Rides"
        description="Rides currently in flight (REQUESTED → IN_TRIP)"
        action={<AutoRefresh />}
        tabs={<RideOpsTabs active="live" />}
      />
      <RidesTable
        rides={rides}
        approvedDrivers={approvedDrivers}
        canWrite={canWrite}
        emptyMessage="No rides currently in flight"
      />
    </div>
  );
}
