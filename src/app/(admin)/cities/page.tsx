import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { CityForm } from "./CityForm";
import { CityRow } from "./CityRow";

export const dynamic = "force-dynamic";

async function getCities() {
  try {
    return await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { drivers: true, rides: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function CitiesPage() {
  const cities = await getCities();

  return (
    <div>
      <PageHeader
        title="Cities"
        description="Archetype (Metro vs Small Town) drives matching radius, surge, and payment options"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CityForm />
        </div>

        <div className="lg:col-span-2">
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
