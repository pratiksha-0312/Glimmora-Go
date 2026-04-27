import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getRiders(q?: string) {
  try {
    return await prisma.rider.findMany({
      where: q
        ? {
            OR: [
              { phone: { contains: q } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: { select: { rides: true } },
        rides: {
          select: { fareFinal: true, status: true, createdAt: true },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function RidersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAccess("riders");
  const { q } = await searchParams;
  const riders = await getRiders(q);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Riders" },
        ]}
        title="Riders"
        description="Registered riders with lifetime ride count and spend"
      />

      <form className="mb-4" action="/riders" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by phone or name"
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </form>

      <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Rider</th>
                <th className="px-5 py-3 text-left">Language</th>
                <th className="px-5 py-3 text-left">Rides</th>
                <th className="px-5 py-3 text-left">Completed</th>
                <th className="px-5 py-3 text-left">Lifetime Spend</th>
                <th className="px-5 py-3 text-left">Last Ride</th>
                <th className="px-5 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    No riders found
                  </td>
                </tr>
              ) : (
                riders.map((r) => {
                  const completed = r.rides.filter(
                    (x) => x.status === "COMPLETED"
                  );
                  const spend = completed.reduce(
                    (s, x) => s + (x.fareFinal ?? 0),
                    0
                  );
                  const lastRide = r.rides.reduce<Date | null>((acc, x) => {
                    if (!acc || x.createdAt > acc) return x.createdAt;
                    return acc;
                  }, null);
                  return (
                    <tr key={r.id} className="hover:bg-[#fbf7f2]">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">
                          {r.name ?? "—"}
                        </div>
                        <div className="text-xs text-slate-500">{r.phone}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="default">
                          {r.language === "hi" ? "हिन्दी" : "English"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {r._count.rides}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {completed.length}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatCurrency(spend)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {lastRide ? formatDate(lastRide) : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatDate(r.createdAt)}
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
