import { z } from "zod";
import { closePositionAgent } from "@arya/agents/agents/close-position";

const PositionHealthAlertSchema = z.object({
  positionTokenId: z.string(),
  poolAddress: z.string(),
  walletAddress: z.string(),
  chainId: z.number().default(1),
  liquidity: z.string(),
  currentTick: z.number(),
  tickLower: z.number(),
  tickUpper: z.number(),
  impermanentLoss: z.number(),
  isOutOfRange: z.boolean(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PositionHealthAlertSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await closePositionAgent(parsed.data);

  return Response.json(result, { status: result.status === "closed" ? 200 : 500 });
}
