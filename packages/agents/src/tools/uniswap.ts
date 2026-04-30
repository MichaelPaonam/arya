export interface SwapQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  chainId: number;
  maxPriceImpact?: number;
}

export interface SwapQuote {
  amountOut: string;
  gasEstimate: string;
  route: { protocol: string; percent: number }[];
  priceImpact: number;
}

export interface SwapCalldataParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  chainId: number;
  slippageTolerance: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface SwapCalldata {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface ApprovalParams {
  token: string;
  amount: string;
  walletAddress: string;
  chainId: number;
}

export interface ApprovalResult {
  isApproved: boolean;
  allowance: string;
  approvalTx?: { to: string; data: string };
}

export async function getSwapQuote(_params: SwapQuoteParams): Promise<SwapQuote> {
  throw new Error("Not implemented");
}

export async function buildSwapCalldata(_params: SwapCalldataParams): Promise<SwapCalldata> {
  throw new Error("Not implemented");
}

export async function checkApproval(_params: ApprovalParams): Promise<ApprovalResult> {
  throw new Error("Not implemented");
}
