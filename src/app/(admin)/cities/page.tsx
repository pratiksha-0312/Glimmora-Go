import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { CityForm } from "./CityForm";
import { CityRow } from "./CityRow";
import { ArchetypeCard } from "./ArchetypeCard";
import { requireAccess, sessionCanWrite } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [cities, defaults] = await Promise.all([
      prisma.city.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { drivers: true, rides: true } },
        },
      }),
      prisma.archetypeDefaults.findMany({ orderBy: { archetype: "asc" } }),
    ]);
    return { cities, defaults };
  } catch {
    return { cities: [], defaults: [] };
  }
}

export default async function CitiesPage() {
  const session = await requireAccess("cities");
  const canWrite = sessionCanWrite(session, "cities");
  const { cities, defaults } = await getData();

  return (
    <div>
      <PageHeader
        title="Cities"
        description="Archetype (Metro vs Small Town) drives matching radius, surge, and payment options"
      />

      {defaults.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Archetype defaults
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {defaults.map((d) => (
              <ArchetypeCard
                key={d.archetype}
                defaults={d}
                canWrite={canWrite}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {canWrite && (
          <div className="lg:col-span-1">
            <CityForm />
          </div>
        )}

        <div className={canWrite ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Configured Cities
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {cities.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  No cities yet. Add your first on the left.
                </div>
              ) : (
                cities.map((c) => <CityRow key={c.id} city={c} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
