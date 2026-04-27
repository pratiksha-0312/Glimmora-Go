import { PageHeader } from "@/components/ui/PageHeader";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { RidesTable } from "../_components/RidesTable";
import { RideOpsTabs } from "../_components/RideOpsTabs";
import { fetchRides } from "../_components/queries";
import { RideStatus } from "../../../../../generated/prisma";

export const dynamic = "force-dynamic";

export default async function ScheduledRidesPage() {
  const session = await requireAccess("rides");
  const canWrite = sessionCanWrite(session, "rides");
  const { rides, approvedDrivers } = await fetchRides({
    cityId: session.cityId,
    where: {
      scheduledAt: { gt: new Date() },
      status: { in: [RideStatus.REQUESTED, RideStatus.MATCHED] },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Ride Operations" },
          { label: "Scheduled Rides" },
        ]}
        title="Scheduled Rides"
        description="Upcoming rides booked for a future time"
        tabs={<RideOpsTabs active="scheduled" />}
      />
      <RidesTable
        rides={rides}
        approvedDrivers={approvedDrivers}
        canWrite={canWrite}
        showScheduledColumn
        emptyMessage="No scheduled rides"
      />
    </div>
  );
}
