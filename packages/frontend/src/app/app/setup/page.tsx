"use client";

import { SetupWizard } from "@/components/setup-wizard/setup-wizard";
import { useWalletMounted } from "@/hooks/use-wallet";

export default function SetupPage() {
  const mounted = useWalletMounted();

  return (
    <main className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.22_0.04_220/0.6),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,oklch(0.18_0.06_250/0.4),transparent_60%)]" />
      <div className="relative z-10">
        <header className="flex justify-center py-8">
          <h1 className="text-3xl font-bold tracking-[0.25em] text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">ARYA</h1>
        </header>
        {mounted && <SetupWizard />}
      </div>
    </main>
  );
}
