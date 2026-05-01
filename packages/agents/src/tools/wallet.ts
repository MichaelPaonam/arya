import { createPublicClient, http, erc20Abi, type Address } from "viem";
import { mainnet } from "viem/chains";

export interface GetTokenBalanceParams {
  token: string;
  walletAddress: string;
  chainId: number;
}

export interface TokenBalance {
  balance: string;
  decimals: number;
  symbol: string;
}

export interface GetNativeBalanceParams {
  walletAddress: string;
  chainId: number;
}

export interface NativeBalance {
  balance: string; // wei
}

function getRpcUrl(chainId: number): string {
  if (chainId === 16602) return "https://evmrpc-testnet.0g.ai";
  if (chainId === 1) return `https://eth-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"] ?? ""}`;
  if (chainId === 11155111) return `https://eth-sepolia.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"] ?? ""}`;
  return mainnet.rpcUrls.default.http[0]!;
}

function getClient(chainId: number) {
  return createPublicClient({
    transport: http(getRpcUrl(chainId)),
  });
}

export async function getTokenBalance(params: GetTokenBalanceParams): Promise<TokenBalance> {
  const client = getClient(params.chainId);

  const [balance, decimals, symbol] = await Promise.all([
    client.readContract({
      address: params.token as Address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [params.walletAddress as Address],
    }),
    client.readContract({
      address: params.token as Address,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    client.readContract({
      address: params.token as Address,
      abi: erc20Abi,
      functionName: "symbol",
    }),
  ]);

  return {
    balance: balance.toString(),
    decimals,
    symbol,
  };
}

export async function getNativeBalance(params: GetNativeBalanceParams): Promise<NativeBalance> {
  const client = getClient(params.chainId);

  const balance = await client.getBalance({
    address: params.walletAddress as Address,
  });

  return {
    balance: balance.toString(),
  };
}
