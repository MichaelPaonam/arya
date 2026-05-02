"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";
type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

const ThemeContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "arya-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    } else {
      localStorage.setItem(STORAGE_KEY, "dark");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
        toggle: () => setThemeState((t) => (t === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`grid size-11 place-items-center rounded-xl border border-border bg-[var(--glass-1-bg)] backdrop-blur-xl transition hover:bg-[var(--glass-2-bg)] ${className}`}
    >
      {theme === "light" ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      )}
    </button>
  );
}
