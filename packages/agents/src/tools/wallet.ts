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

export async function getTokenBalance(_params: GetTokenBalanceParams): Promise<TokenBalance> {
  throw new Error("Not implemented");
}

export async function getNativeBalance(_params: GetNativeBalanceParams): Promise<NativeBalance> {
  throw new Error("Not implemented");
}
