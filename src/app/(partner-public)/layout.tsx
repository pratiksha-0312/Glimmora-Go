import type { Metadata, Viewport } from "next";
import { RegisterSW } from "../(partner)/p/RegisterSW";

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

export default function PartnerPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <RegisterSW />
    </>
  );
}
