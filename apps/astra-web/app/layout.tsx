import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, Gift, Home, Sparkles, UserRound, UsersRound } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { ui } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: ui.metadata.title,
  description: ui.metadata.description
};

const navItems = [
  { href: "/journey", label: ui.nav.journey, icon: Sparkles },
  { href: "/allies", label: ui.nav.allies, icon: UsersRound },
  { href: "/self", label: ui.nav.self, icon: UserRound },
  { href: "/library", label: ui.nav.library, icon: BookMarked },
  { href: "/gifts", label: ui.nav.gifts, icon: Gift }
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav className={mobile ? "bottom-nav" : "nav"} aria-label={mobile ? ui.nav.mobileNavigation : ui.nav.primaryNavigation}>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <item.icon size={mobile ? 18 : 19} aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

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
              <Link className="brand" href="/journey">
                <Home size={24} aria-hidden="true" />
                <strong>{ui.shell.brand}</strong>
                <span>{ui.shell.tagline}</span>
              </Link>
              <ThemeToggle />
            </div>
            <Navigation />
          </aside>
          <main className="main">{children}</main>
          <div className="mobile-theme-toggle">
            <ThemeToggle />
          </div>
          <Navigation mobile />
        </div>
      </body>
    </html>
  );
}
