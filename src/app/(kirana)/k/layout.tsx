import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getKiranaSession } from "@/lib/kiranaAuth";
import { KiranaNav } from "./KiranaNav";
import { PendingGate } from "./PendingGate";

export default async function KiranaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getKiranaSession();
  if (!session) redirect("/k/login");

  const partner = await prisma.kiranaPartner.findUnique({
    where: { id: session.partnerId },
    select: {
      shopName: true,
      status: true,
      reviewNote: true,
    },
  });

  if (!partner) redirect("/k/login");

  if (partner.status !== "APPROVED") {
    return <PendingGate status={partner.status} note={partner.reviewNote} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-xs font-black text-white">
              GG
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {partner.shopName}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Kirana Partner
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 p-4 pb-24">
        {children}
      </main>
      <KiranaNav />
    </div>
  );
}
