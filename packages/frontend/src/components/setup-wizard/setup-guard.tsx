"use client";

import { useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter, usePathname } from "next/navigation";
import { useWalletMounted } from "@/hooks/use-wallet";
import { YIELD_SWARM_REGISTRY } from "@/lib/contracts";

function SetupRedirect() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  const { data: swarmMembers, isLoading } = useReadContract({
    address: YIELD_SWARM_REGISTRY.address,
    abi: YIELD_SWARM_REGISTRY.abi,
    functionName: "getSwarmMembers",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (!isConnected) return;
    if (pathname === "/app/setup") return;
    if (isLoading) return;

    if (swarmMembers && (swarmMembers as unknown[]).length > 0) {
      localStorage.setItem("arya-swarm-initialized", "true");
      return;
    }

    const initialized = localStorage.getItem("arya-swarm-initialized");
    if (!initialized) {
      router.replace("/app/setup");
    }
  }, [isConnected, isLoading, pathname, router, swarmMembers]);

  return null;
}

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const mounted = useWalletMounted();

  return (
    <>
      {mounted && <SetupRedirect />}
      {children}
    </>
  );
}
