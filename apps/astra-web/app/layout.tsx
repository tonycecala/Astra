import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, Gift, Home, Sparkles, UserRound, UsersRound } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astra",
  description: "A clean symbolic stream reader foundation."
};

const navItems = [
  { href: "/journey", label: "Journey", icon: Sparkles },
  { href: "/allies", label: "Allies", icon: UsersRound },
  { href: "/self", label: "Self", icon: UserRound },
  { href: "/library", label: "Library", icon: BookMarked },
  { href: "/gifts", label: "Gifts", icon: Gift }
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav className={mobile ? "bottom-nav" : "nav"} aria-label={mobile ? "Mobile navigation" : "Primary navigation"}>
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
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <Link className="brand" href="/journey">
              <Home size={24} aria-hidden="true" />
              <strong>Astra</strong>
              <span>Clean start foundation</span>
            </Link>
            <Navigation />
          </aside>
          <main className="main">{children}</main>
          <Navigation mobile />
        </div>
      </body>
    </html>
  );
}
