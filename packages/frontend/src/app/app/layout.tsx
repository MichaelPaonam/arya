"use client";

import { AppModeProvider } from "@/hooks/use-app-mode";
import { SetupGuard } from "@/components/setup-wizard/setup-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppModeProvider>
      <SetupGuard>
        {children}
      </SetupGuard>
    </AppModeProvider>
  );
}
