"use client";

import { useState, useEffect, createContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { getConfig } from "@/lib/wagmi-config";

export const WalletMountedContext = createContext(false);

function WalletProviders({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <WalletMountedContext.Provider value={false}>{children}</WalletMountedContext.Provider>;
  }

  return <WalletProvidersInner theme={theme} queryClient={queryClient}>{children}</WalletProvidersInner>;
}

function WalletProvidersInner({ theme, queryClient, children }: { theme: string; queryClient: QueryClient; children: React.ReactNode }) {
  const [config] = useState(() => getConfig());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={
            theme === "dark"
              ? darkTheme({ accentColor: "oklch(0.85 0.12 230)", borderRadius: "large" })
              : lightTheme({ accentColor: "oklch(0.30 0.05 235)", borderRadius: "large" })
          }
        >
          <WalletMountedContext.Provider value={true}>
            {children}
          </WalletMountedContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WalletProviders>{children}</WalletProviders>
    </ThemeProvider>
  );
}
