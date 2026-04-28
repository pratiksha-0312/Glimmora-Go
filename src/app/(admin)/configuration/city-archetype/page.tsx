import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { EditArchetypeButton } from "./EditArchetypeButton";

export const dynamic = "force-dynamic";

const LABEL = {
  METRO: "Metro",
  SMALL_TOWN: "Small Town",
} as const;

async function getDefaults() {
  try {
    return await prisma.archetypeDefaults.findMany({
      orderBy: { archetype: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function CityArchetypePage() {
  const session = await requireAccess("cities");
  const canWrite = sessionCanWrite(session, "cities");
  const defaults = await getDefaults();

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Configuration" },
          { label: "City Archetype" },
        ]}
        title="City Archetype"
        description="Templates that seed default matching radius, surge, payments and fares for new cities"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[color:var(--brand-sand-border)] bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Templates configured
          </div>
          <div className="mt-1 text-2xl font-bold text-[color:var(--brand-text)]">
            {defaults.length}
          </div>
        </div>
        <div className="rounded-xl border border-[color:var(--brand-sand-border)] bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Metro base fare
          </div>
          <div className="mt-1 text-2xl font-bold text-[color:var(--brand-text)]">
            {formatCurrency(
              defaults.find((d) => d.archetype === "METRO")?.baseFare ?? 0
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[color:var(--brand-sand-border)] bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Small town base fare
          </div>
          <div className="mt-1 text-2xl font-bold text-[color:var(--brand-text)]">
            {formatCurrency(
              defaults.find((d) => d.archetype === "SMALL_TOWN")?.baseFare ?? 0
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--brand-sand-border)] bg-white shadow-sm">
        <div className="border-b border-[color:var(--brand-sand-border)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[color:var(--brand-text)]">
            Archetype templates
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[color:var(--brand-sand-border)] bg-[color:var(--brand-cream)] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Archetype</th>
                <th className="px-5 py-3 text-left">Match radius</th>
                <th className="px-5 py-3 text-left">Surge</th>
                <th className="px-5 py-3 text-left">Base fare</th>
                <th className="px-5 py-3 text-left">Per km / min</th>
                <th className="px-5 py-3 text-left">Min fare</th>
                <th className="px-5 py-3 text-left">Payments</th>
                {canWrite && (
                  <th className="px-5 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {defaults.length === 0 ? (
                <tr>
                  <td
                    colSpan={canWrite ? 8 : 7}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    No archetype defaults seeded yet. Run{" "}
                    <code className="rounded bg-[color:var(--brand-cream)] px-1.5 py-0.5 text-xs">
                      npm run db:seed
                    </code>
                    .
                  </td>
                </tr>
              ) : (
                defaults.map((d) => (
                  <tr key={d.archetype} className="hover:bg-[color:var(--brand-cream)]">
                    <td className="px-5 py-3 font-medium text-[color:var(--brand-text)]">
                      {LABEL[d.archetype]}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {d.matchingRadiusKm} km
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {d.surgeMultiplier.toFixed(1)}×
                    </td>
                    <td className="px-5 py-3 font-medium text-[color:var(--brand-text)]">
                      {formatCurrency(d.baseFare)}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      ₹{d.perKm} / ₹{d.perMin}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {formatCurrency(d.minimumFare)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {d.paymentOptions.map((p) => (
                          <Badge key={p} variant="default">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    {canWrite && (
                      <td className="px-5 py-3 text-right">
                        <EditArchetypeButton defaults={d} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
