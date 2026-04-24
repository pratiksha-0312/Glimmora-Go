import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConcessionEditor } from "./ConcessionEditor";
import { requireAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getCities() {
  try {
    return await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: { fareConfig: true },
    });
  } catch {
    return [];
  }
}

export default async function ConcessionsPage() {
  await requireAccess("concessions");
  const cities = await getCities();

  return (
    <div>
      <PageHeader
        title="Concession Pricing"
        description="Discount multipliers for women, senior citizens, and children — applied on top of fare"
      />

      <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 ring-1 ring-blue-200">
        Multipliers less than 1.0 are discounts. Example: 0.85 = 15% off.
      </div>

      {cities.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No cities configured yet.
        </div>
      ) : (
        <div className="space-y-4">
          {cities.map((c) => (
            <ConcessionEditor key={c.id} city={c} />
          ))}
        </div>
      )}
    </div>
  );
}
