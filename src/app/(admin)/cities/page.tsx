import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewCityButton } from "./NewCityButton";
import { CityRow } from "./CityRow";
import { requireAccess, sessionCanWrite } from "@/lib/auth";

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
  const session = await requireAccess("cities");
  const canWrite = sessionCanWrite(session, "cities");
  const cities = await getCities();

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Pricing & Promotions" },
          { label: "City Pricing Rules" },
        ]}
        title="City Pricing Rules"
        description="Per-city archetype assignment, matching radius, surge multiplier and payment options"
        action={canWrite ? <NewCityButton /> : undefined}
      />

      <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
        <div className="border-b border-[#f0e4d6] px-5 py-4">
          <h3 className="text-sm font-semibold text-[#3a2d28]">
            Configured Cities
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {cities.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              No cities yet. Click &ldquo;New City&rdquo; to add your first.
            </div>
          ) : (
            cities.map((c) => <CityRow key={c.id} city={c} />)
          )}
        </div>
      </div>
    </div>
  );
}
