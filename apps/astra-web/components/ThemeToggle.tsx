"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { ui } from "../lib/i18n";

type AstraTheme = "light" | "dark";

const storageKey = "astra:theme:v1";
const cookieKey = "astra_theme";
const themeChangeEvent = "astra-theme-change";

function readThemeCookie(): AstraTheme | null {
  const cookie = typeof document.cookie === "string" ? document.cookie : "";
  const match = cookie.match(new RegExp(`(?:^|; )${cookieKey}=([^;]+)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === "light" || value === "dark" ? value : null;
}

function readTheme(): AstraTheme {
  if (typeof window === "undefined") return "light";

  try {
    const stored = window.localStorage?.getItem(storageKey);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }

  const cookieTheme = readThemeCookie();
  if (cookieTheme) return cookieTheme;

  const current = document.documentElement.dataset.astraTheme;
  if (current === "light" || current === "dark") return current;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: AstraTheme) {
  document.documentElement.dataset.astraTheme = theme;
  try {
    document.cookie = `${cookieKey}=${theme}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // The DOM theme still updates when cookies are unavailable.
  }
  try {
    window.localStorage?.setItem(storageKey, theme);
  } catch {
    // The DOM theme still updates when storage is unavailable.
  }
}

function subscribeTheme(callback: () => void) {
  window.addEventListener(themeChangeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(themeChangeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

function serverThemeSnapshot(): AstraTheme {
  return "light";
}

function setTheme(theme: AstraTheme) {
  applyTheme(theme);
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverThemeSnapshot);
  const isDark = theme === "dark";
  const label = isDark ? ui.theme.switchToLight : ui.theme.switchToDark;

  return (
    <button aria-label={label} aria-pressed={isDark} className="theme-toggle" onClick={() => setTheme(isDark ? "light" : "dark")} title={label} type="button">
      <Sun aria-hidden="true" className={!isDark ? "theme-toggle-icon-active" : undefined} size={16} />
      <Moon aria-hidden="true" className={isDark ? "theme-toggle-icon-active" : undefined} size={15} />
    </button>
  );
}
