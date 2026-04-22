import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { FareEditor } from "./FareEditor";

export const dynamic = "force-dynamic";

async function getCitiesWithFares() {
  try {
    return await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: { fareConfig: true },
    });
  } catch {
    return [];
  }
}

export default async function FaresPage() {
  const cities = await getCitiesWithFares();

  return (
    <div>
      <PageHeader
        title="Fare Config"
        description="Base fare, per km, per min, and minimum fare per city"
      />

      {cities.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No cities configured yet. Go to Cities to add one.
        </div>
      ) : (
        <div className="space-y-4">
          {cities.map((c) => (
            <FareEditor key={c.id} city={c} />
          ))}
        </div>
      )}
    </div>
  );
}
