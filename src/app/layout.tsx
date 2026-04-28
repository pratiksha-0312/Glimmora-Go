import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glimmora Go — Admin",
  description: "Admin panel for Glimmora Go ride-hailing platform",
};

// Inlined into <head> so the theme is applied before the first paint.
// Without this, the page renders with the default Terracotta palette and
// then flashes to the saved theme once ColorThemePicker hydrates.
const THEME_INIT = `
  try {
    var t = localStorage.getItem('glimmora.theme');
    if (t && t !== 'terracotta') {
      document.documentElement.setAttribute('data-theme', t);
    }
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
