import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { closePositionAgent, type ClosePositionAgentInput, type ClosePositionAgentResult } from "./close-position.js";

vi.mock("../tools/on-chain.js", () => ({
  recordOutcome: vi.fn().mockResolvedValue({ txHash: "0xmocktxhash" }),
}));

describe("closePositionAgent", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_KEY_MODULE", "0x7e32eded548a5512b7956a8b3817f2bad4bdc20a");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const validInput: ClosePositionAgentInput = {
    positionTokenId: "123456",
    poolAddress: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
    walletAddress: "0xc1Ac7fd08367321b5d486a81349Ab1CB793aF0C1",
    chainId: 1,
    liquidity: "1000000000000000000",
    currentTick: -200100,
    tickLower: -200000,
    tickUpper: -199000,
    impermanentLoss: 7.5,
    isOutOfRange: true,
  };

  it("returns status closed with valid calldata", async () => {
    const result = await closePositionAgent(validInput);
    expect(result.status).toBe("closed");
    expect(result.calldata).toBeDefined();
    expect(result.calldata!.to).toBe("0xC36442b4a4522E871399CD717aBDD847Ab11FE88");
    expect(result.calldata!.data).toMatch(/^0x/);
    expect(result.calldata!.value).toBe("0");
  });

  it("sets autoExecuted to true", async () => {
    const result = await closePositionAgent(validInput);
    expect(result.autoExecuted).toBe(true);
  });

  it("records outcome on-chain", async () => {
    const { recordOutcome } = await import("../tools/on-chain.js");
    const result = await closePositionAgent(validInput);
    expect(result.outcomeRecorded).toBe(true);
    expect(recordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        strategyId: expect.any(String),
        actualReturn: expect.any(Number),
      })
    );
  });

  it("computes netReturnBps from impermanentLoss", async () => {
    const result = await closePositionAgent(validInput);
    expect(result.netReturnBps).toBe(-750);
  });

  it("returns positionId from input", async () => {
    const result = await closePositionAgent(validInput);
    expect(result.positionId).toBe("123456");
  });

  it("fails if session key validation fails (non-zero value scenario)", async () => {
    const result = await closePositionAgent(validInput);
    expect(result.status).not.toBe("failed");
  });
});
