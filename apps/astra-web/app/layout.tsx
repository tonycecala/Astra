import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AppNavigation } from "../components/AppNavigation";
import { SidebarAccountControls, TopBar } from "../components/TopBar";
import { getAstraAuthContext } from "../lib/auth/profile";
import { ui } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: ui.metadata.title,
  description: ui.metadata.description
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await getAstraAuthContext();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
            `.trim()
          }}
        />
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
