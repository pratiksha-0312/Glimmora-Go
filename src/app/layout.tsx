import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glimmora Go — Admin",
  description: "Admin panel for Glimmora Go ride-hailing platform",
};

// Applied before first paint — no flash of wrong theme or mode.
const THEME_INIT = `
  try {
    var t = localStorage.getItem('glimmora.theme');
    if (t && t !== 'terracotta') document.documentElement.setAttribute('data-theme', t);
    if (localStorage.getItem('glimmora.darkMode') === 'true') document.documentElement.classList.add('dark');
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
