import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArchetypeCard } from "../ArchetypeCard";
import { requireAccess, sessionCanWrite } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
        description="Default matching radius, surge, payments and base fare applied when a new city is created in this archetype"
      />

      {defaults.length === 0 ? (
        <div className="rounded-xl border border-[#f0e4d6] bg-white px-5 py-12 text-center text-sm text-slate-400 shadow-sm">
          No archetype defaults seeded yet. Run{" "}
          <code className="rounded bg-[#fbf7f2] px-1.5 py-0.5 text-xs">
            npm run db:seed
          </code>
          .
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {defaults.map((d) => (
            <ArchetypeCard
              key={d.archetype}
              defaults={d}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
