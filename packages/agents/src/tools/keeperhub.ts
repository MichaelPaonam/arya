import { z } from "zod";

const KEEPERHUB_BASE = "https://app.keeperhub.com/api";

export interface CreateWorkflowFromTemplateParams {
  poolAddress: string;
  userWallet: string;
  chainId: number;
  ilThreshold?: number;
  valueDropThreshold?: number;
  tokenPair?: [string, string];
}

export interface Workflow {
  id: string;
  name: string;
  status?: string;
  createdAt: string;
}

export interface PublishResult {
  id: string;
  status: string;
  publishedAt: string;
}

const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().optional(),
  createdAt: z.string(),
});

const PublishResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  publishedAt: z.string(),
});

function getApiKey(): string {
  return process.env["KEEPERHUB_API_KEY"] ?? "kh_default";
}

function getTemplateId(): string | undefined {
  return process.env["KEEPERHUB_TEMPLATE_ID"];
}

async function keeperhubRequest(method: string, path: string, body?: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${KEEPERHUB_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getApiKey()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(`KeeperHub API error ${response.status}: ${errorBody["error"] ?? response.statusText}`);
  }

  return response.json();
}

interface WorkflowNode {
  id: string;
  data: {
    type: string;
    label: string;
    config: Record<string, unknown>;
    status: string;
    description: string;
  };
  type: string;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  type: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

interface FullWorkflowResponse {
  id: string;
  name: string;
  createdAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// Well-known Uniswap V3 pool token addresses (Ethereum mainnet)
const POOL_TOKENS: Record<string, { token0: string; token1: string }> = {
  "WETH-USDC": { token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  "USDC-WETH": { token0: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
  "WETH-USDT": { token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
  "WBTC-WETH": { token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
  "USDC-USDT": { token0: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
  "DAI-USDC": { token0: "0x6B175474E89094C44Da98b954EedeAC495271d0F", token1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  "WETH-DAI": { token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
  "wstETH-WETH": { token0: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
};

function resolvePoolTokens(pair: [string, string] | undefined, poolName: string): { token0: string; token1: string } {
  // Try from pair first
  if (pair) {
    const key = pair.join("-");
    if (POOL_TOKENS[key]) return POOL_TOKENS[key];
    const reverseKey = [...pair].reverse().join("-");
    if (POOL_TOKENS[reverseKey]) return POOL_TOKENS[reverseKey];
  }
  // Try from pool name
  if (POOL_TOKENS[poolName]) return POOL_TOKENS[poolName];
  // Default to WETH/USDC
  return POOL_TOKENS["WETH-USDC"]!;
}

function customizeNodes(nodes: WorkflowNode[], params: CreateWorkflowFromTemplateParams): WorkflowNode[] {
  const tokens = resolvePoolTokens(params.tokenPair, params.poolAddress);

  return nodes.map((node) => {
    const actionType = node.data.config["actionType"] as string | undefined;
    const updated = { ...node, data: { ...node.data, config: { ...node.data.config } } };

    switch (actionType) {
      case "uniswap/get-position":
        updated.data.config["tokenId"] = "0";
        updated.data.config["network"] = "1";
        break;
      case "uniswap/get-pool":
        updated.data.config["tokenA"] = tokens.token0;
        updated.data.config["tokenB"] = tokens.token1;
        updated.data.config["fee"] = "3000";
        updated.data.config["network"] = "1";
        break;
      case "webhook/send":
        // webhook/send not yet supported in KeeperHub UI — skip
        break;
      case "telegram/send-message":
        updated.data.config["message"] = `⚠️ ARYA Alert: LP position needs attention.\nPool: ${params.poolAddress}\nWallet: ${params.userWallet.slice(0, 10)}...`;
        break;
    }
    return updated;
  });
}

export async function duplicateWorkflow(templateId: string): Promise<FullWorkflowResponse> {
  const json = await keeperhubRequest("POST", `/workflows/${templateId}/duplicate`);
  return json as FullWorkflowResponse;
}

export async function publishWorkflow(id: string): Promise<PublishResult> {
  const json = await keeperhubRequest("PUT", `/workflows/${id}/go-live`);
  return PublishResultSchema.parse(json);
}

export async function createWorkflowFromTemplate(params: CreateWorkflowFromTemplateParams): Promise<Workflow> {
  const templateId = getTemplateId();
  if (!templateId) {
    throw new Error("KEEPERHUB_TEMPLATE_ID not configured — cannot instantiate from template");
  }

  const copy = await duplicateWorkflow(templateId);
  const updatedNodes = customizeNodes(copy.nodes, params);

  try {
    await keeperhubRequest("PATCH", `/workflows/${copy.id}`, {
      name: `ARYA Monitor — ${params.tokenPair ? params.tokenPair.join("/") : params.poolAddress.slice(0, 10)}`,
      nodes: updatedNodes,
    });
  } catch {
    // PATCH is best-effort — workflow exists even if customization fails
  }

  return WorkflowSchema.parse({
    id: copy.id,
    name: copy.name,
    createdAt: copy.createdAt,
  });
}
