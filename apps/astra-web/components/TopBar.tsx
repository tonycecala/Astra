"use client";

import { Bell, CircleHelp, Settings, Sparkles as Stars, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "../lib/auth/client";
import { ui } from "../lib/i18n";
import { ThemeToggle } from "./ThemeToggle";

const topbarRoutes = [
  { href: "/journey", label: ui.nav.journey },
  { href: "/allies", label: ui.nav.allies },
  { href: "/self", label: ui.nav.self },
  { href: "/charts", label: ui.nav.charts },
  { href: "/library", label: ui.nav.library },
  { href: "/gifts", label: ui.nav.gifts }
];

function activeRouteLabel(pathname: string) {
  return topbarRoutes.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`))?.label ?? ui.nav.journey;
}

function accountInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "A";
}

function useAccountState() {
  const { data: session } = authClient.useSession();
  const accountName = session?.user?.name || session?.user?.email || ui.account.guestName;
  const accountEmail = session?.user?.email ?? "";
  const signedIn = Boolean(session?.user);

  async function signOut() {
    await authClient.signOut();
  }

  return { accountEmail, accountName, signedIn, signOut };
}

function AccountMenu({ align = "right" }: { align?: "right" | "left" }) {
  const { accountEmail, accountName, signedIn, signOut } = useAccountState();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <details className="account-menu" data-align={align} onToggle={(event) => setOpen(event.currentTarget.open)} open={open} ref={menuRef}>
      <summary className="account-profile-button" aria-label={ui.account.menuLabel} title={signedIn ? accountName : ui.account.signIn}>
        <span className="account-avatar" aria-hidden="true">
          {accountInitial(accountName)}
        </span>
      </summary>
      <div className="account-panel" role="menu" aria-label={ui.account.menuLabel}>
        <div className="account-identity">
          <span className="account-avatar account-avatar-large" aria-hidden="true">
            {accountInitial(accountName)}
          </span>
          <span>
            <strong>{accountName}</strong>
            {accountEmail ? <small>{accountEmail}</small> : <small>{ui.account.signedOut}</small>}
          </span>
        </div>
        <Link href="/self" role="menuitem">
          <UserRound size={16} aria-hidden="true" />
          <span>{ui.account.account}</span>
        </Link>
        <Link href="/stars" role="menuitem">
          <Stars size={16} aria-hidden="true" />
          <span>{ui.account.stars}</span>
        </Link>
        <button className="account-action account-action-disabled" type="button" role="menuitem" disabled>
          <CircleHelp size={16} aria-hidden="true" />
          <span>{ui.account.help}</span>
        </button>
        <button className="account-action account-action-disabled" type="button" role="menuitem" disabled>
          <Settings size={16} aria-hidden="true" />
          <span>{ui.account.settings}</span>
        </button>
        {signedIn ? (
          <button className="account-action" type="button" onClick={signOut} role="menuitem">
            {ui.account.signOut}
          </button>
        ) : (
          <Link href="/login?next=/self" role="menuitem">
            <UserRound size={16} aria-hidden="true" />
            <span>{ui.account.signIn}</span>
          </Link>
        )}
      </div>
    </details>
  );
}

export function SidebarAccountControls() {
  const { accountName } = useAccountState();

  return (
    <div className="sidebar-account" aria-label={ui.account.sidebarLabel}>
      <div className="sidebar-utility-links">
        <button className="sidebar-utility-link" type="button" disabled>
          <CircleHelp size={18} aria-hidden="true" />
          <span>{ui.account.help}</span>
        </button>
        <button className="sidebar-utility-link" type="button" disabled>
          <Settings size={18} aria-hidden="true" />
          <span>{ui.account.settings}</span>
        </button>
      </div>
      <div className="sidebar-account-card">
        <AccountMenu align="left" />
        <div className="sidebar-account-copy">
          <strong>{accountName}</strong>
          <span>{ui.account.stars}</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="topbar" aria-label={ui.account.mobileTopbarLabel}>
      <h1 className="topbar-route-title">{activeRouteLabel(pathname)}</h1>
      <div className="topbar-actions">
        <Link className="topbar-icon-button topbar-stars-button" href="/stars" aria-label={ui.account.stars} title={ui.account.stars}>
          <Stars size={17} aria-hidden="true" />
          <span className="topbar-stars-count">+</span>
        </Link>
        <button className="topbar-icon-button topbar-icon-button-disabled" type="button" aria-label={ui.account.noNotifications} title={ui.account.noNotifications} disabled>
          <Bell size={17} aria-hidden="true" />
        </button>
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
