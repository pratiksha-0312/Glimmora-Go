import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partnerAuth";
import { PartnerNav } from "./PartnerNav";
import { PendingGate } from "./PendingGate";
import { RegisterSW } from "./RegisterSW";
import { InstallPrompt } from "./InstallPrompt";

export const metadata: Metadata = {
  title: "Glimmora Go — Partner",
  description: "Book rides for walk-in customers and earn commission.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Glimmora Partner",
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f16c1e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPartnerSession();
  if (!session) redirect("/p/login");

  const partner = await prisma.partner.findUnique({
    where: { id: session.partnerId },
    select: {
      shopName: true,
      status: true,
      reviewNote: true,
    },
  });

  if (!partner) redirect("/p/login");

  if (partner.status !== "APPROVED") {
    return (
      <>
        <PendingGate status={partner.status} note={partner.reviewNote} />
        <RegisterSW />
      </>
    );
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
                Partner
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 p-4 pb-24">
        {children}
      </main>
      <PartnerNav />
      <RegisterSW />
      <InstallPrompt />
    </div>
  );
}
