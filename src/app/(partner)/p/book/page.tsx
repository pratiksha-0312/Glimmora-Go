import { prisma } from "@/lib/db";
import { requirePartner } from "@/lib/partnerAuth";
import { BookForm } from "./BookForm";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const session = await requirePartner();
  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    include: {
      city: { select: { name: true, state: true } },
    },
  });
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Book a ride</h1>
        <p className="text-xs text-slate-500">
          For a walk-in customer in {partner?.city.name}, {partner?.city.state}
        </p>
      </div>
      <BookForm
        commissionPct={partner?.commissionPct ?? 10}
        cityName={partner?.city.name ?? ""}
      />
    </div>
  );
}
