"use client";

import { BookMarked, Compass, Sparkles as Stars, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ui } from "../lib/i18n";

const navItems = [
  { href: "/journey", label: ui.nav.journey, icon: Compass },
  { href: "/allies", label: ui.nav.allies, icon: UsersRound },
  { href: "/self", label: ui.nav.self, icon: UserRound },
  { href: "/library", label: ui.nav.library, icon: BookMarked },
  { href: "/gifts", label: ui.nav.gifts, icon: Stars }
];

function isActivePath(pathname: string, href: string, chartOwner: string | null) {
  if (pathname === "/charts" && chartOwner === "allies") return href === "/allies";
  if (pathname === "/charts" && chartOwner === "self") return href === "/self";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chartOwner = searchParams.has("chart") || searchParams.has("chartId") ? searchParams.get("from") : null;

  return (
    <nav className={mobile ? "bottom-nav" : "nav"} aria-label={mobile ? ui.nav.mobileNavigation : ui.nav.primaryNavigation}>
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href, chartOwner);

        return (
          <Link aria-current={active ? "page" : undefined} key={item.href} href={item.href}>
            <item.icon size={mobile ? 18 : 19} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
