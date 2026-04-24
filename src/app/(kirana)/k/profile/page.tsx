import { prisma } from "@/lib/db";
import { requireKirana } from "@/lib/kiranaAuth";
import { formatDate } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import { Documents } from "./Documents";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireKirana();
  const partner = await prisma.kiranaPartner.findUnique({
    where: { id: session.partnerId },
    include: {
      city: true,
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!partner) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Profile</h1>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <Row label="Shop">{partner.shopName}</Row>
        <Row label="Owner">{partner.ownerName}</Row>
        <Row label="Phone">{partner.phone}</Row>
        <Row label="City">
          {partner.city.name}, {partner.city.state}
        </Row>
        <Row label="Commission">{partner.commissionPct}%</Row>
        <Row label="Joined">{formatDate(partner.createdAt)}</Row>
        <Row label="Status">
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            {partner.status}
          </span>
        </Row>
      </div>

      <Documents docs={partner.documents} />

      <LogoutButton />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}
