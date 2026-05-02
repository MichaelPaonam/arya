"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { AppMode } from "@/lib/feature-flags";

interface AppModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined);

const STORAGE_KEY = "arya-app-mode";

function getInitialMode(): AppMode {
  if (typeof window === "undefined") return "hackathon";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "full" || stored === "hackathon") return stored;
  return (process.env.NEXT_PUBLIC_APP_MODE as AppMode) || "hackathon";
}

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("hackathon");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setModeState(getInitialMode());
    setMounted(true);
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  if (!mounted) {
    return <AppModeContext.Provider value={{ mode: "hackathon", setMode }}>{children}</AppModeContext.Provider>;
  }

  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }
  return context;
}
