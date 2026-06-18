import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ComposerShell } from "../components/ComposerShell";
import { composerUi } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: composerUi.metadata.title,
  description: composerUi.metadata.description
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ComposerShell brand={composerUi.brand} tagline={composerUi.tagline}>
          {children}
        </ComposerShell>
      </body>
    </html>
  );
}
