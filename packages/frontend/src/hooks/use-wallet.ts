"use client";

import { useContext } from "react";
import { WalletMountedContext } from "@/components/providers";

export function useWalletMounted() {
  return useContext(WalletMountedContext);
}
