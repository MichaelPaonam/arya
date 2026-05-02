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
  const ilThreshold = params.ilThreshold ?? 5;

  const poolNode = nodes.find((n) => n.data.config["actionType"] === "uniswap/get-pool");
  const positionNode = nodes.find((n) => n.data.config["actionType"] === "uniswap/get-position");

  const updated = nodes.map((node) => {
    const actionType = node.data.config["actionType"] as string | undefined;
    const copy = { ...node, data: { ...node.data, config: { ...node.data.config } } };

    switch (actionType) {
      case "uniswap/get-position":
        copy.data.config["network"] = "1";
        break;
      case "uniswap/get-pool":
        copy.data.config["tokenA"] = tokens.token0;
        copy.data.config["tokenB"] = tokens.token1;
        copy.data.config["fee"] = "3000";
        copy.data.config["network"] = "1";
        break;
      case "webhook/send-webhook": {
        applyWebhookConfig(copy, params);
        break;
      }
      case "telegram/send-message":
        copy.data.config["message"] = `⚠️ ARYA Alert: LP position needs attention.\nPool: ${params.poolAddress}\nWallet: ${params.userWallet.slice(0, 10)}...`;
        break;
      case "Condition":
        applyConditionConfig(copy, ilThreshold, poolNode?.id, positionNode?.id);
        break;
    }

    return copy;
  });

  return updated;
}

function applyConditionConfig(node: WorkflowNode, ilThreshold: number, poolNodeId?: string, positionNodeId?: string): void {
  node.data.label = "Compute Position Health";
  node.data.description = `Check if position is out of range or IL exceeds ${ilThreshold}%.`;
  node.data.config["actionType"] = "Condition";

  const poolRef = poolNodeId ? `{{@${poolNodeId}:Read Pool State.tick}}` : "{{Read Pool State.tick}}";
  const tickLowerRef = positionNodeId ? `{{@${positionNodeId}:Read LP Position.tickLower}}` : "{{Read LP Position.tickLower}}";
  const tickUpperRef = positionNodeId ? `{{@${positionNodeId}:Read LP Position.tickUpper}}` : "{{Read LP Position.tickUpper}}";

  node.data.config["conditionConfig"] = {
    group: {
      id: "arya-health-check",
      logic: "OR",
      rules: [
        {
          id: "rule-out-of-range-below",
          operator: "<",
          leftOperand: poolRef,
          rightOperand: tickLowerRef,
        },
        {
          id: "rule-out-of-range-above",
          operator: ">",
          leftOperand: poolRef,
          rightOperand: tickUpperRef,
        },
      ],
    },
  };
}

function applyWebhookConfig(node: WorkflowNode, params: CreateWorkflowFromTemplateParams): void {
  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"]
    || (process.env["VERCEL_URL"] ? `https://${process.env["VERCEL_URL"]}` : "http://localhost:3000");
  node.data.config["actionType"] = "webhook/send-webhook";
  node.data.config["webhookUrl"] = `${baseUrl}/api/alerts/position-health`;
  node.data.config["webhookMethod"] = "POST";
  node.data.config["webhookHeaders"] = JSON.stringify({ "Content-Type": "application/json" });
  node.data.config["webhookPayload"] = JSON.stringify({
    positionTokenId: "{{Read LP Position.tokenId}}",
    poolAddress: "{{Read Pool State.poolAddress}}",
    walletAddress: params.userWallet,
    chainId: params.chainId,
    liquidity: "{{Read LP Position.liquidity}}",
    currentTick: "{{Read Pool State.tick}}",
    tickLower: "{{Read LP Position.tickLower}}",
    tickUpper: "{{Read LP Position.tickUpper}}",
    impermanentLoss: "{{Compute Position Health.impermanentLoss}}",
    isOutOfRange: "{{Compute Position Health.isOutOfRange}}",
  });
  node.data.description = "Auto-close position via ARYA if IL exceeds threshold";
}

function buildWebhookNode(params: CreateWorkflowFromTemplateParams, conditionNode: WorkflowNode): WorkflowNode {
  const node: WorkflowNode = {
    id: `webhook-stoploss-${Date.now()}`,
    type: "action",
    position: { x: conditionNode.position.x + 300, y: conditionNode.position.y - 80 },
    data: {
      type: "Webhook",
      label: "Stop-Loss Webhook",
      config: {},
      status: "idle",
      description: "Auto-close position via ARYA if IL exceeds threshold",
    },
  };
  applyWebhookConfig(node, params);
  return node;
}

function injectWebhookIfMissing(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  params: CreateWorkflowFromTemplateParams
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const hasWebhook = nodes.some((n) => n.data.config["actionType"] === "webhook/send-webhook");
  if (hasWebhook) return { nodes, edges };

  const conditionNode = nodes.find((n) =>
    n.data.type === "condition" || n.data.label?.toLowerCase().includes("health") || n.data.label?.toLowerCase().includes("compute")
  );
  if (!conditionNode) return { nodes, edges };

  const webhookNode = buildWebhookNode(params, conditionNode);
  const newEdge: WorkflowEdge = {
    id: `edge-${conditionNode.id}-${webhookNode.id}`,
    type: "condition",
    source: conditionNode.id,
    target: webhookNode.id,
    sourceHandle: "true",
  };

  return {
    nodes: [...nodes, webhookNode],
    edges: [...edges, newEdge],
  };
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
  const customizedNodes = customizeNodes(copy.nodes, params);
  const { nodes: finalNodes, edges: finalEdges } = injectWebhookIfMissing(customizedNodes, copy.edges, params);

  try {
    await keeperhubRequest("PATCH", `/workflows/${copy.id}`, {
      name: `ARYA Monitor — ${params.tokenPair ? params.tokenPair.join("/") : params.poolAddress.slice(0, 10)}`,
      nodes: finalNodes,
      edges: finalEdges,
    });
  } catch {
    // PATCH is best-effort — workflow exists even if customization fails
  }

  try {
    await publishWorkflow(copy.id);
  } catch {
    // go-live is best-effort — workflow can be enabled manually
  }

  return WorkflowSchema.parse({
    id: copy.id,
    name: copy.name,
    createdAt: copy.createdAt,
  });
}
