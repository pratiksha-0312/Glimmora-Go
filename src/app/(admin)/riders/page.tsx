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
        title="Riders"
        description="Registered riders with lifetime ride count and spend"
      />

      <form className="mb-5" action="/riders" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by phone or name…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/40"
        />
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#21262d] dark:bg-[#161b27]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0d1117]/60">
                {["Rider", "Language", "Rides", "Completed", "Lifetime Spend", "Last Ride", "Joined"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21262d]">
              {riders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-sm text-slate-400 dark:text-slate-500"
                  >
                    No riders found
                  </td>
                </tr>
              ) : (
                riders.map((r) => {
                  const completed = r.rides.filter((x) => x.status === "COMPLETED");
                  const spend = completed.reduce((s, x) => s + (x.fareFinal ?? 0), 0);
                  const lastRide = r.rides.reduce<Date | null>((acc, x) => {
                    if (!acc || x.createdAt > acc) return x.createdAt;
                    return acc;
                  }, null);

                  return (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1c2230]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {r.name ?? "—"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {r.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={r.language === "hi" ? "info" : "default"}>
                          {r.language === "hi" ? "हिन्दी" : "English"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {r._count.rides}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-medium text-green-700 dark:text-green-400">
                          {completed.length}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(spend)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 dark:text-slate-500">
                        {lastRide ? formatDate(lastRide) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 dark:text-slate-500">
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
