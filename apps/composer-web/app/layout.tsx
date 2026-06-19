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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  var storedTheme = window.localStorage && window.localStorage.getItem("composer:theme:v1");
  var cookieMatch = document.cookie.match(/(?:^|; )composer_theme=([^;]+)/);
  var cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  var systemTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  var theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : systemTheme;
  document.documentElement.dataset.composerTheme = theme;
} catch {
  document.documentElement.dataset.composerTheme = "light";
}
            `.trim()
          }}
        />
      </head>
      <body>
        <ComposerShell brand={composerUi.brand} tagline={composerUi.tagline}>
          {children}
        </ComposerShell>
      </body>
    </html>
  );
}
