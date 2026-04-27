import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glimmora Go — Admin",
  description: "Admin panel for Glimmora Go ride-hailing platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
