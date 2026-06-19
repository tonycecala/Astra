"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { composerUi } from "../lib/i18n";

type Theme = "light" | "dark";

const storageKey = "composer:theme:v1";
const cookieKey = "composer_theme";
const themeChangeEvent = "composer-theme-change";

function readThemeCookie(): Theme | null {
  const cookie = typeof document.cookie === "string" ? document.cookie : "";
  const match = cookie.match(new RegExp(`(?:^|; )${cookieKey}=([^;]+)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === "light" || value === "dark" ? value : null;
}

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }

  const cookieTheme = readThemeCookie();
  if (cookieTheme) return cookieTheme;

  const current = document.documentElement.dataset.composerTheme;
  if (current === "light" || current === "dark") return current;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.composerTheme = theme;
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // The DOM theme still updates when storage is unavailable.
  }
  try {
    document.cookie = `${cookieKey}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // The DOM theme still updates when cookies are unavailable.
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

function serverThemeSnapshot(): Theme {
  return "light";
}

function setComposerTheme(theme: Theme) {
  applyTheme(theme);
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ComposerThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverThemeSnapshot);
  const nextTheme: Theme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? composerUi.shell.switchToDark : composerUi.shell.switchToLight;

  return (
    <button
      aria-label={label}
      aria-pressed={theme === "dark"}
      className="theme-toggle"
      onClick={() => {
        setComposerTheme(nextTheme);
      }}
      title={label}
      type="button"
    >
      <Sun aria-hidden="true" className={theme === "light" ? "theme-toggle-icon-active" : ""} size={16} />
      <Moon aria-hidden="true" className={theme === "dark" ? "theme-toggle-icon-active" : ""} size={15} />
    </button>
  );
}
