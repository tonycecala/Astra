import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";
import { AppNavigation } from "../components/AppNavigation";
import { ThemeToggle } from "../components/ThemeToggle";
import { ui } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: ui.metadata.title,
  description: ui.metadata.description
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
              <Link className="brand" href="/">
                <Home size={24} aria-hidden="true" />
                <strong>{ui.shell.brand}</strong>
                <span>{ui.shell.tagline}</span>
              </Link>
              <ThemeToggle />
            </div>
            <AppNavigation />
          </aside>
          <main className="main">{children}</main>
          <div className="mobile-theme-toggle">
            <ThemeToggle />
          </div>
          <AppNavigation mobile />
        </div>
      </body>
    </html>
  );
}
