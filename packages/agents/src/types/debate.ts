import { z } from "zod";

export const ChallengeTypeSchema = z.enum([
  "data_contradiction",
  "risk_underestimate",
  "assumption_invalid",
  "correlation_risk",
]);

export type ChallengeType = z.infer<typeof ChallengeTypeSchema>;

export const ChallengeSchema = z.object({
  challengerId: z.string(),
  targetStrategyId: z.string(),
  challengeType: ChallengeTypeSchema,
  evidence: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

export type Challenge = z.infer<typeof ChallengeSchema>;

export const ChallengeResponseSchema = z.object({
  responderId: z.string(),
  challengeId: z.string(),
  response: z.enum(["concede", "counter"]),
  counterEvidence: z.string().optional(),
});

export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;

export const DebateTierSchema = z.enum(["fast", "standard", "deep"]);

export type DebateTier = z.infer<typeof DebateTierSchema>;

export const DebateOutcomeSchema = z.object({
  strategyId: z.string(),
  tier: DebateTierSchema,
  challengesRaised: z.number(),
  challengesSurvived: z.number(),
  confidenceScore: z.number().min(0).max(1),
  latencyMs: z.number(),
  debateLog: z.array(z.union([ChallengeSchema, ChallengeResponseSchema])),
});

export type DebateOutcome = z.infer<typeof DebateOutcomeSchema>;
