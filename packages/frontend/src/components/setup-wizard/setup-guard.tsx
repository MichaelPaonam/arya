"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter, usePathname } from "next/navigation";
import { useWalletMounted } from "@/hooks/use-wallet";
import { YIELD_SWARM_REGISTRY } from "@/lib/contracts";

function useNeedsSetup(pathname: string) {
  const { address, isConnected } = useAccount();
  const [checked, setChecked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  const { data: swarmMembers, isLoading } = useReadContract({
    address: YIELD_SWARM_REGISTRY.address,
    abi: YIELD_SWARM_REGISTRY.abi,
    functionName: "getSwarmMembers",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    const initialized = localStorage.getItem("arya-swarm-initialized");

    if (initialized) {
      setNeedsSetup(false);
      setChecked(true);
      return;
    }

    if (!isConnected) {
      setNeedsSetup(true);
      setChecked(true);
      return;
    }

    if (isLoading) return;

    if (swarmMembers && (swarmMembers as unknown[]).length > 0) {
      localStorage.setItem("arya-swarm-initialized", "true");
      setNeedsSetup(false);
      setChecked(true);
      return;
    }

    setNeedsSetup(true);
    setChecked(true);
  }, [isConnected, isLoading, swarmMembers, pathname]);

  return { checked, needsSetup };
}

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const mounted = useWalletMounted();
  const router = useRouter();
  const pathname = usePathname();
  const { checked, needsSetup } = useNeedsSetup(pathname);

  useEffect(() => {
    if (!mounted || !checked) return;
    if (pathname === "/app/setup") return;
    if (localStorage.getItem("arya-swarm-initialized")) return;
    if (needsSetup) {
      router.replace("/app/setup");
    }
  }, [mounted, checked, needsSetup, pathname, router]);

  if (!mounted || !checked) return null;
  if (needsSetup && pathname !== "/app/setup" && !localStorage.getItem("arya-swarm-initialized")) return null;

  return <>{children}</>;
}
