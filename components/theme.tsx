"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark" | undefined;
  setTheme: (t: Theme) => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

function applyClass(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/**
 * Lightweight theme provider following Next's "Preventing Flash" guide.
 * The pre-paint class is set by an inline script in the root layout <head>;
 * this provider only handles runtime toggling, persistence, and system sync.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark" | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  // Hydrate from storage after mount (matches what the inline boot script applied).
  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "system";
    setThemeState(stored);
    setResolvedTheme(resolve(stored));
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    const resolved = resolve(next);
    setResolvedTheme(resolved);
    applyClass(resolved);
  }, []);

  // Follow the OS while in "system" mode.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = mq.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyClass(resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
