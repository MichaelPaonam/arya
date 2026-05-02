import { describe, it, expect } from "vitest";
import { buildClosePositionCalldata, type ClosePositionParams } from "./close-position.js";
import { decodeFunctionData } from "viem";

const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const MULTICALL_ABI = [
  {
    name: "multicall",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "data", type: "bytes[]" }],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
] as const;

describe("buildClosePositionCalldata", () => {
  const baseParams: ClosePositionParams = {
    tokenId: "123456",
    liquidity: "1000000000000000000",
    recipient: "0xc1Ac7fd08367321b5d486a81349Ab1CB793aF0C1",
    deadline: Math.floor(Date.now() / 1000) + 300,
  };

  it("returns calldata targeting the NonfungiblePositionManager", () => {
    const result = buildClosePositionCalldata(baseParams);
    expect(result.to).toBe(POSITION_MANAGER);
  });

  it("returns value of 0 (no ETH sent)", () => {
    const result = buildClosePositionCalldata(baseParams);
    expect(result.value).toBe("0");
  });

  it("encodes a multicall with 2 inner calls", () => {
    const result = buildClosePositionCalldata(baseParams);
    const decoded = decodeFunctionData({
      abi: MULTICALL_ABI,
      data: result.data as `0x${string}`,
    });
    expect(decoded.functionName).toBe("multicall");
    expect(decoded.args[0]).toHaveLength(2);
  });

  it("uses amount0Min=0 and amount1Min=0 for demo mode", () => {
    const result = buildClosePositionCalldata(baseParams);
    expect(result.data).toContain("0".repeat(64));
  });

  it("includes the tokenId in the encoded data", () => {
    const result = buildClosePositionCalldata(baseParams);
    const tokenIdHex = BigInt(baseParams.tokenId).toString(16).padStart(64, "0");
    expect(result.data).toContain(tokenIdHex);
  });

  it("allows custom amount0Min and amount1Min", () => {
    const result = buildClosePositionCalldata({
      ...baseParams,
      amount0Min: "100",
      amount1Min: "200",
    });
    expect(result.data.length).toBeGreaterThan(10);
  });
});
