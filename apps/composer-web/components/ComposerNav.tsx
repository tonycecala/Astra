"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { composerUi } from "../lib/i18n";
import { composerRoutes } from "../lib/routes";

export function ComposerNav() {
  const pathname = usePathname();

  return (
    <nav className="composer-nav" aria-label={composerUi.shell.navLabel}>
      {composerRoutes.map((route) => {
        const Icon = route.icon;
        const isActive = pathname === route.href;
        return (
          <Link aria-current={isActive ? "page" : undefined} href={route.href} key={route.href}>
            <Icon aria-hidden="true" size={17} />
            <span>{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
