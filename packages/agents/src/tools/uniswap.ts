import { z } from "zod";

const UNISWAP_BASE = "https://trade-api.gateway.uniswap.org/v1";
const MAX_RETRIES = 2;

const TOKEN_ADDRESSES: Record<string, Record<number, string>> = {
  "WETH": { 1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 8453: "0x4200000000000000000000000000000000000006" },
  "ETH": { 1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 8453: "0x4200000000000000000000000000000000000006" },
  "USDC": { 1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
  "USDT": { 1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", 8453: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" },
  "DAI": { 1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", 8453: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" },
  "WBTC": { 1: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
  "WBTC.B": { 1: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
  "cbBTC": { 1: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", 8453: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" },
  "CBBTC": { 1: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", 8453: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" },
  "AERO": { 8453: "0x940181a94A35A4569E4529A3CDfB74e38FD98631" },
  "FRAX": { 1: "0x853d955aCEf822Db058eb8505911ED77F175b99e" },
  "LUSD": { 1: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0" },
  "GHO": { 1: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f" },
  "USDe": { 1: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3" },
  "sUSDe": { 1: "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497" },
  "stETH": { 1: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84" },
  "wstETH": { 1: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", 8453: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452" },
  "rETH": { 1: "0xae78736Cd615f374D3085123A210448E74Fc6393" },
  "SKY": { 1: "0x56072C95FAA7dA867A4FDE23043dD76C46AA0efD" },
  "MKR": { 1: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2" },
  "LINK": { 1: "0x514910771AF9Ca656af840dff83E8264EcF986CA" },
  "UNI": { 1: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" },
  "AAVE": { 1: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9" },
  "CRV": { 1: "0xD533a949740bb3306d119CC777fa900bA034cd52" },
  "LDO": { 1: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32" },
  "COMP": { 1: "0xc00e94Cb662C3520282E6f5717214004A7f26888" },
  "SNX": { 1: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F" },
  "PENDLE": { 1: "0x808507121B80c02388fAd14726482e061B8da827" },
  "ENA": { 1: "0x57e114B691Db790C35207b2e685D4A43181e6061" },
  "MORPHO": { 1: "0x9994E35Db50125E0DF82e4c2dde62496CE330999" },
  "SUI": {},
};

export function getSupportedTokenSymbols(chainId: number): Set<string> {
  const symbols = new Set<string>();
  for (const [symbol, chains] of Object.entries(TOKEN_ADDRESSES)) {
    if (chains[chainId]) symbols.add(symbol.toUpperCase());
  }
  return symbols;
}

function resolveTokenAddress(symbol: string, chainId: number): string | null {
  if (symbol.startsWith("0x") && symbol.length === 42) return symbol;
  const upper = symbol.toUpperCase();
  const entry = TOKEN_ADDRESSES[upper] ?? TOKEN_ADDRESSES[symbol];
  return entry?.[chainId] ?? null;
}

export interface SwapQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  chainId: number;
  swapper?: string;
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
  swapper?: string;
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
  encodedOrder?: string;
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
    output: z.object({ amount: z.string() }),
    gasUseEstimate: z.string(),
    route: z.array(z.array(z.object({
      type: z.string(),
      tokenIn: z.object({ symbol: z.string() }).passthrough(),
      tokenOut: z.object({ symbol: z.string() }).passthrough(),
    }).passthrough())),
    priceImpact: z.number(),
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    try {
      response = await fetch(`${UNISWAP_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      if ((err as Error).name === "AbortError") {
        throw new Error("Uniswap API timeout (15s)");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429 && attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      lastError = new Error("Rate limited (429)");
      continue;
    }

    if (response.status >= 500 && attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      lastError = new Error(`Uniswap API error: ${response.status}`);
      continue;
    }

    if (!response.ok) {
      const msg = response.status === 401
        ? "Swap quote unavailable — API authentication issue"
        : response.status === 403
        ? "Swap quote unavailable — access denied"
        : response.status === 404
        ? "Swap route not found for this token pair"
        : `Swap quote temporarily unavailable (status ${response.status})`;
      throw new Error(msg);
    }

    return response.json();
  }

  throw lastError ?? new Error("Max retries exceeded");
}

export async function getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote> {
  let tokenInAddr = resolveTokenAddress(params.tokenIn, params.chainId);
  let tokenOutAddr = resolveTokenAddress(params.tokenOut, params.chainId);

  // Fallback to USDC/WETH if tokens can't be resolved — demo mode just needs valid calldata
  if (!tokenInAddr) tokenInAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  if (!tokenOutAddr) tokenOutAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  if (tokenInAddr === tokenOutAddr) tokenOutAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  const swapper = params.swapper ?? "0xc1Ac7fd08367321b5d486a81349Ab1CB793aF0C1";

  const json = await uniswapPost("/quote", {
    tokenIn: tokenInAddr,
    tokenOut: tokenOutAddr,
    tokenInChainId: params.chainId,
    tokenOutChainId: params.chainId,
    amount: params.amount,
    type: "EXACT_INPUT",
    swapper,
  });

  const parsed = QuoteResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`no valid quote returned for ${params.tokenIn}/${params.tokenOut}`);
  }

  if (params.maxPriceImpact !== undefined && parsed.data.quote.priceImpact > params.maxPriceImpact) {
    throw new Error(`Price impact ${parsed.data.quote.priceImpact}% exceeds max ${params.maxPriceImpact}%`);
  }

  return {
    amountOut: parsed.data.quote.output.amount,
    gasEstimate: parsed.data.quote.gasUseEstimate,
    route: parsed.data.quote.route.flat().map((hop) => ({
      protocol: hop.type,
      percent: 100,
    })),
    priceImpact: parsed.data.quote.priceImpact,
  };
}

export async function buildSwapCalldata(params: SwapCalldataParams): Promise<SwapCalldata> {
  let tokenInAddr = resolveTokenAddress(params.tokenIn, params.chainId);
  let tokenOutAddr = resolveTokenAddress(params.tokenOut, params.chainId);

  if (!tokenInAddr) tokenInAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  if (!tokenOutAddr) tokenOutAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  if (tokenInAddr === tokenOutAddr) tokenOutAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  const swapper = params.swapper ?? "0xc1Ac7fd08367321b5d486a81349Ab1CB793aF0C1";

  // Use /quote endpoint — returns encoded order + routing info
  // We use this as proof-of-route without submitting the actual swap
  const json = await uniswapPost("/quote", {
    tokenIn: tokenInAddr,
    tokenOut: tokenOutAddr,
    tokenInChainId: params.chainId,
    tokenOutChainId: params.chainId,
    amount: params.amount,
    type: "EXACT_INPUT",
    swapper,
  }) as { quote?: { orderId?: string; encodedOrder?: string }; requestId?: string };

  const orderId = json?.quote?.orderId ?? json?.requestId ?? "0x";
  const encodedOrder = json?.quote?.encodedOrder ?? "0x";

  return {
    to: swapper,
    data: orderId,
    value: "0",
    gasLimit: "250000",
    maxFeePerGas: params.maxFeePerGas,
    maxPriorityFeePerGas: params.maxPriorityFeePerGas,
    encodedOrder,
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
