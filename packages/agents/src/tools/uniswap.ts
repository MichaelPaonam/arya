import { z } from "zod";

const UNISWAP_BASE = "https://trade-api.gateway.uniswap.org/v1";
const MAX_RETRIES = 1;

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

const QuoteResponseSchema = z.object({
  quote: z.object({
    amountOut: z.string(),
    gasEstimate: z.string(),
    route: z.array(z.object({ protocol: z.string(), percent: z.number() })),
    priceImpact: z.number(),
  }),
});

const SwapResponseSchema = z.object({
  swap: z.object({
    to: z.string(),
    data: z.string(),
    value: z.string(),
    gasLimit: z.string(),
  }),
});

const ApprovalResponseSchema = z.object({
  approval: z.object({
    isApproved: z.boolean(),
    allowance: z.string(),
    approvalTx: z.object({ to: z.string(), data: z.string() }).optional(),
  }),
});

function getApiKey(): string {
  return process.env["UNISWAP_API_KEY"] ?? "";
}

async function uniswapPost(endpoint: string, body: Record<string, unknown>): Promise<unknown> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${UNISWAP_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      lastError = new Error("Rate limited (429)");
      continue;
    }

    if (!response.ok) {
      throw new Error(`Uniswap API error: ${response.status}`);
    }

    return response.json();
  }

  throw lastError ?? new Error("Max retries exceeded");
}

export async function getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote> {
  const json = await uniswapPost("/quote", {
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amount: params.amount,
    chainId: params.chainId,
  });

  const parsed = QuoteResponseSchema.parse(json);

  if (params.maxPriceImpact !== undefined && parsed.quote.priceImpact > params.maxPriceImpact) {
    throw new Error(`Price impact ${parsed.quote.priceImpact}% exceeds max ${params.maxPriceImpact}%`);
  }

  return parsed.quote;
}

export async function buildSwapCalldata(params: SwapCalldataParams): Promise<SwapCalldata> {
  const json = await uniswapPost("/swap", {
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amount: params.amount,
    chainId: params.chainId,
    slippageTolerance: params.slippageTolerance,
  });

  const parsed = SwapResponseSchema.parse(json);

  return {
    ...parsed.swap,
    maxFeePerGas: params.maxFeePerGas,
    maxPriorityFeePerGas: params.maxPriorityFeePerGas,
  };
}

export async function checkApproval(params: ApprovalParams): Promise<ApprovalResult> {
  const json = await uniswapPost("/check_approval", {
    token: params.token,
    amount: params.amount,
    walletAddress: params.walletAddress,
    chainId: params.chainId,
  });

  const parsed = ApprovalResponseSchema.parse(json);
  return parsed.approval;
}
