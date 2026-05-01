"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { AppModeProvider } from "@/hooks/use-app-mode";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AppModeProvider>
        {children}
      </AppModeProvider>
    </ThemeProvider>
  );
}
