"use client";

import { usePathname } from "next/navigation";
import { composerRoutes } from "../lib/routes";

function activeRouteLabel(pathname: string) {
  return composerRoutes.find((route) => route.href === pathname || (route.href !== "/" && pathname.startsWith(`${route.href}/`)))?.label ?? composerRoutes[0].label;
}

export function ComposerTopRouteTitle() {
  const pathname = usePathname();

  return <strong className="composer-mobile-route-title">{activeRouteLabel(pathname)}</strong>;
}
