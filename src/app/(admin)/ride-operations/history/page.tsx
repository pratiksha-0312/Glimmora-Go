import { PageHeader } from "@/components/ui/PageHeader";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { RidesTable } from "../_components/RidesTable";
import { RideOpsTabs } from "../_components/RideOpsTabs";
import { fetchRides, HISTORY_STATUSES } from "../_components/queries";

export const dynamic = "force-dynamic";

export default async function RideHistoryPage() {
  const session = await requireAccess("rides");
  const canWrite = sessionCanWrite(session, "rides");
  const { rides, approvedDrivers } = await fetchRides({
    cityId: session.cityId,
    where: { status: { in: HISTORY_STATUSES } },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Ride Operations" },
          { label: "Ride History" },
        ]}
        title="Ride History"
        description="Completed and cancelled rides"
        tabs={<RideOpsTabs active="history" />}
      />
      <RidesTable
        rides={rides}
        approvedDrivers={approvedDrivers}
        canWrite={canWrite}
        emptyMessage="No history yet"
      />
    </div>
  );
}
