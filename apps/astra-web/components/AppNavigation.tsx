"use client";

import { BookMarked, Gift, Sparkles, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ui } from "../lib/i18n";

const navItems = [
  { href: "/journey", label: ui.nav.journey, icon: Sparkles },
  { href: "/allies", label: ui.nav.allies, icon: UsersRound },
  { href: "/self", label: ui.nav.self, icon: UserRound },
  { href: "/library", label: ui.nav.library, icon: BookMarked },
  { href: "/gifts", label: ui.nav.gifts, icon: Gift }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={mobile ? "bottom-nav" : "nav"} aria-label={mobile ? ui.nav.mobileNavigation : ui.nav.primaryNavigation}>
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);

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
