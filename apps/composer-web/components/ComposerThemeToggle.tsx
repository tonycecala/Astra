"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { composerUi } from "../lib/i18n";

type Theme = "light" | "dark";

function preferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("composer:theme:v1");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.composerTheme = theme;
  window.localStorage.setItem("composer:theme:v1", theme);
  document.cookie = `composer_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function ComposerThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    window.setTimeout(() => {
      const initialTheme = preferredTheme();
      applyTheme(initialTheme);
      setTheme(initialTheme);
    }, 0);
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? composerUi.shell.switchToDark : composerUi.shell.switchToLight;

  return (
    <button
      aria-label={label}
      aria-pressed={theme === "dark"}
      className="theme-toggle"
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
      title={label}
      type="button"
    >
      <Sun aria-hidden="true" className={theme === "light" ? "theme-toggle-icon-active" : ""} size={16} />
      <Moon aria-hidden="true" className={theme === "dark" ? "theme-toggle-icon-active" : ""} size={15} />
    </button>
  );
}
