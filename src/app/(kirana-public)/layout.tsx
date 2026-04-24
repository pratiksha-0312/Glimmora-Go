import type { Metadata, Viewport } from "next";
import { RegisterSW } from "../(kirana)/k/RegisterSW";

export const metadata: Metadata = {
  title: "Glimmora Go — Kirana Partner",
  description: "Book rides for walk-in customers and earn commission.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Glimmora Kirana",
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

export default function KiranaPublicLayout({
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
