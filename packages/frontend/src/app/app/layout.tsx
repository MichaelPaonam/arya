"use client";

import { AppModeProvider } from "@/hooks/use-app-mode";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppModeProvider>
      {children}
    </AppModeProvider>
  );
}
