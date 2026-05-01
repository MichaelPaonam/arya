import { z } from "zod";

export const StrategyCategorySchema = z.enum([
  "liquidity_provision",
  "yield_farming",
  "arbitrage",
  "lending",
  "staking",
]);

export type StrategyCategory = z.infer<typeof StrategyCategorySchema> | string;

export const OpportunityFoundSchema = z.object({
  id: z.string(),
  protocol: z.string(),
  pool: z.string(),
  tokenPair: z.tuple([z.string(), z.string()]),
  estimatedAPY: z.number(),
  tvl: z.number(),
  category: z.string(),
  source: z.enum(["defi-llama", "uniswap-api", "on-chain"]),
  reasoning: z.string(),
  discoveredAt: z.number(),
  agentId: z.string(),
});

export type OpportunityFound = z.infer<typeof OpportunityFoundSchema>;

export const RiskAssessmentSchema = z.object({
  opportunityId: z.string(),
  riskScore: z.number().min(1).max(10),
  impermanentLoss: z.number(),
  contractRisk: z.enum(["low", "medium", "high"]),
  liquidityRisk: z.enum(["low", "medium", "high"]),
  correlationWithPortfolio: z.number().min(-1).max(1),
  reasoning: z.string(),
  agentId: z.string(),
});

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const SwapActionSchema = z.object({
  target: z.string(),
  value: z.bigint(),
  calldata: z.string(),
  minAmountOut: z.bigint(),
});

export type SwapAction = z.infer<typeof SwapActionSchema>;

export const ExecutionResultSchema = z.object({
  strategyId: z.string(),
  status: z.enum(["executed", "failed", "expired", "pending_approval"]),
  txHash: z.string().optional(),
  keeperWorkflowId: z.string().optional(),
  actualGas: z.bigint().optional(),
  error: z.string().optional(),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;
