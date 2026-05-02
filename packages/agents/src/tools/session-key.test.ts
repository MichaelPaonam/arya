import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { validateSessionKey, type ValidateSessionKeyParams } from "./session-key.js";

const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

describe("validateSessionKey", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_KEY_MODULE", "0x7e32eded548a5512b7956a8b3817f2bad4bdc20a");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const validParams: ValidateSessionKeyParams = {
    sessionKey: "0xabcdef1234567890abcdef1234567890abcdef12",
    target: POSITION_MANAGER,
    value: 0n,
  };

  it("returns valid for PositionManager target with value=0", async () => {
    const result = await validateSessionKey(validParams);
    expect(result.isValid).toBe(true);
  });

  it("returns invalid for unauthorized target", async () => {
    const result = await validateSessionKey({
      ...validParams,
      target: "0x0000000000000000000000000000000000000001",
    });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("target");
  });

  it("returns invalid for non-zero value", async () => {
    const result = await validateSessionKey({
      ...validParams,
      value: 1000000000000000000n,
    });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("value");
  });

  it("returns remainingBudget when valid", async () => {
    const result = await validateSessionKey(validParams);
    expect(result.remainingBudget).toBeDefined();
  });
});
