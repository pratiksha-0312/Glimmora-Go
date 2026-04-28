import { PageHeader } from "@/components/ui/PageHeader";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { RidesTable } from "./_components/RidesTable";
import { RideOpsTabs } from "./_components/RideOpsTabs";
import { fetchRides } from "./_components/queries";
import { RideStatus } from "../../../../generated/prisma";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: (RideStatus | "ALL")[] = [
  "ALL",
  "REQUESTED",
  "MATCHED",
  "IN_TRIP",
  "COMPLETED",
  "CANCELLED",
];

export default async function AllRidesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAccess("rides");
  const sp = await searchParams;
  const canWrite = sessionCanWrite(session, "rides");

  const where =
    sp.status && sp.status !== "ALL"
      ? { status: sp.status as RideStatus }
      : {};

  const { rides, approvedDrivers } = await fetchRides({
    cityId: session.cityId,
    where,
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Ride Operations" },
          { label: "All Rides" },
        ]}
        title="Rides"
        description="All rides across statuses"
        tabs={<RideOpsTabs active="all" />}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = (sp.status ?? "ALL") === s;
          return (
            <a
              key={s}
              href={
                s === "ALL"
                  ? "/ride-operations"
                  : `/ride-operations?status=${s}`
              }
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                active
                  ? "bg-[color:var(--brand-500)] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-[color:var(--brand-cream)]"
              }`}
            >
              {s === "ALL" ? "All statuses" : s}
            </a>
          );
        })}
      </div>

      <RidesTable
        rides={rides}
        approvedDrivers={approvedDrivers}
        canWrite={canWrite}
        emptyMessage="No rides found"
      />
    </div>
  );
}
