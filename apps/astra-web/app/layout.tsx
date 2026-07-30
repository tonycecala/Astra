import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Sparkles } from "lucide-react";
import { AppNavigation } from "../components/AppNavigation";
import { SidebarAccountControls, TopBar } from "../components/TopBar";
import { getAstraAuthContext } from "../lib/auth/profile";
import { ui } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: ui.shell.brand,
  title: ui.metadata.title,
  description: ui.metadata.description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: ui.shell.brand
  },
  icons: {
    icon: [
      { url: "/icons/astra-icon.svg", type: "image/svg+xml" },
      { url: "/icons/astra-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/icons/astra-apple-touch.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f12" }
  ]
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await getAstraAuthContext();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="astra-theme" strategy="beforeInteractive">{`
try {
  var storedTheme = window.localStorage && window.localStorage.getItem("astra:theme:v1");
  var cookieMatch = document.cookie.match(/(?:^|; )astra_theme=([^;]+)/);
  var cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  var systemTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  var theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : systemTheme;
  document.documentElement.dataset.astraTheme = theme;
} catch {
  document.documentElement.dataset.astraTheme = "light";
}
        `.trim()}</Script>
      </head>
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand-row">
              <Link className="brand" href="/journey" aria-label={ui.shell.brand}>
                <Sparkles size={24} aria-hidden="true" />
                <strong>{ui.shell.brand}</strong>
              </Link>
            </div>
            <AppNavigation />
            <SidebarAccountControls />
          </aside>
          <main className="main">
            <TopBar starBalance={profile?.starBalance ?? 0} />
            {children}
          </main>
          <AppNavigation mobile />
        </div>
      </body>
    </html>
  );
}
