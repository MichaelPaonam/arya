import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const ogTestnet = defineChain({
  id: 16602,
  name: "0G Chain Testnet",
  nativeCurrency: { name: "A0GI", symbol: "A0GI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Explorer", url: "https://chainscan-galileo.0g.ai" },
  },
  testnet: true,
});

let _config: ReturnType<typeof getDefaultConfig> | null = null;

export function getConfig() {
  if (!_config) {
    _config = getDefaultConfig({
      appName: "ARYA",
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder",
      chains: [ogTestnet],
      ssr: true,
    });
  }
  return _config;
}
