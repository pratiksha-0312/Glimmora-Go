import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { driverStatusVariant } from "@/lib/format";
import { requireAccess } from "@/lib/auth";
import type { AdminRole, DriverStatus } from "../../../../../generated/prisma";

export const dynamic = "force-dynamic";

const FILTERS: (DriverStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
];

async function getDrivers(
  status: string | undefined,
  _role: AdminRole,
  cityId: string | null
) {
  const cityFilter = cityId ? { cityId } : {};
  try {
    return await prisma.driver.findMany({
      where: {
        ...cityFilter,
        ...(status && status !== "ALL"
          ? { status: status as DriverStatus }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        city: { select: { name: true } },
        documents: { select: { id: true, status: true } },
        _count: { select: { rides: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAccess("drivers");
  const { status } = await searchParams;
  const drivers = await getDrivers(status, session.role, session.cityId);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Driver Operations" },
          { label: "Drivers" },
        ]}
        title="Drivers"
        description="Driver onboarding, verification, and status"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((s) => {
          const active = (status ?? "ALL") === s;
          return (
            <a
              key={s}
              href={s === "ALL" ? "/driver-operations/drivers" : `/driver-operations/drivers?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-[#a57865] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-[#fbf7f2]"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </a>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Driver</th>
                <th className="px-5 py-3 text-left">City</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Online</th>
                <th className="px-5 py-3 text-left">Docs</th>
                <th className="px-5 py-3 text-left">Rides</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    No drivers found
                  </td>
                </tr>
              ) : (
                drivers.map((d) => {
                  const pendingDocs = d.documents.filter(
                    (doc) => doc.status === "PENDING"
                  ).length;
                  return (
                    <tr key={d.id} className="hover:bg-[#fbf7f2]">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">
                          {d.name}
                        </div>
                        <div className="text-xs text-slate-500">{d.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {d.city?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={driverStatusVariant(d.status)}>
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        {d.online ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Online
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {d.documents.length} total
                        {pendingDocs > 0 && (
                          <span className="ml-1 text-amber-600">
                            ({pendingDocs} pending)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {d._count.rides}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/driver-operations/drivers/${d.id}`}
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
