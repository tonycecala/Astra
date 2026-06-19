import { LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { getComposerAccessState } from "../lib/config";
import { composerUi } from "../lib/i18n";
import { ComposerNav } from "./ComposerNav";
import { ComposerThemeToggle } from "./ComposerThemeToggle";
import { ComposerTopRouteTitle } from "./ComposerTopRouteTitle";

type ComposerShellProps = {
  brand: string;
  tagline: string;
  children: ReactNode;
};

export function ComposerShell({ brand, tagline, children }: ComposerShellProps) {
  const access = getComposerAccessState();

  if (access.isLocked) {
    return (
      <main className="locked-shell">
        <section className="locked-panel">
          <LockKeyhole aria-hidden="true" size={24} />
          <p className="eyebrow">{brand}</p>
          <h1>{composerUi.shell.accessLocked}</h1>
          <p>{composerUi.shell.lockedDescription}</p>
        </section>
      </main>
    );
  }

  return (
    <div className="composer-shell">
      <aside className="composer-sidebar">
        <div className="composer-brand-row">
          <ComposerTopRouteTitle />
          <div className="composer-brand">
            <strong>{brand}</strong>
            <span>{tagline}</span>
          </div>
          <ComposerThemeToggle />
        </div>
        <ComposerNav />
      </aside>
      <main className="composer-main">{children}</main>
    </div>
  );
}
