import { Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePartner } from "@/lib/partnerAuth";
import { formatDate } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import { Documents } from "./Documents";
import { BankDetails } from "./BankDetails";

export const dynamic = "force-dynamic";

const SUPPORT_PHONE = "+91 80 4567 8900";
const SUPPORT_EMAIL = "partners@glimmora.ai";

export default async function ProfilePage() {
  const session = await requirePartner();
  const partner = await prisma.partner.findUnique({
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

      <BankDetails
        initial={{
          bankAccountName: partner.bankAccountName,
          bankAccountNumber: partner.bankAccountNumber,
          bankIfsc: partner.bankIfsc,
          bankName: partner.bankName,
        }}
      />

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Support contact
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            We&apos;re here Mon–Sat, 9 AM – 7 PM IST
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          <a
            href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Phone className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Call us
              </div>
              <div className="text-sm font-medium text-slate-900">
                {SUPPORT_PHONE}
              </div>
            </div>
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Mail className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Email
              </div>
              <div className="text-sm font-medium text-slate-900">
                {SUPPORT_EMAIL}
              </div>
            </div>
          </a>
        </div>
      </div>

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
