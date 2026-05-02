import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadMemory, downloadMemory } from "./og-storage.js";
import type { AgentMemoryBlob } from "../types/index.js";

vi.mock("@0gfoundation/0g-ts-sdk", () => ({
  Indexer: vi.fn().mockImplementation(() => ({
    upload: vi.fn(),
    downloadToBlob: vi.fn(),
  })),
  MemData: vi.fn().mockImplementation((data: Uint8Array) => ({ data })),
}));

vi.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: vi.fn().mockImplementation(() => ({})),
    Wallet: vi.fn().mockImplementation(() => ({ address: "0xmock" })),
    AbstractSigner: class {},
    Interface: vi.fn().mockImplementation(() => ({
      encodeFunctionData: vi.fn().mockReturnValue("0x"),
    })),
    ZeroAddress: "0x0000000000000000000000000000000000000000",
  },
}));

describe("0G Storage Tool", () => {
  const mockMemory: AgentMemoryBlob = {
    agentId: "agent-1",
    agentType: "scout",
    version: 1,
    timestamp: Date.now(),
    state: {
      discoveredOpportunities: [
        {
          id: "opp-1",
          protocol: "uniswap-v3",
          pool: "0xpool",
          tokenPair: ["USDC", "ETH"],
          estimatedAPY: 12.5,
          tvl: 50_000_000,
          category: "liquidity_provision",
          source: "defi-llama",
          reasoning: "High TVL, stable pair",
          discoveredAt: Date.now(),
          agentId: "agent-1",
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadMemory", () => {
    it("should serialize agent memory and return a root hash", async () => {
      const rootHash = await uploadMemory(mockMemory);

      expect(rootHash).toBeDefined();
      expect(typeof rootHash).toBe("string");
      expect(rootHash.length).toBeGreaterThan(0);
    });

    it("should handle empty state gracefully", async () => {
      const emptyMemory: AgentMemoryBlob = {
        agentId: "agent-2",
        agentType: "risk",
        version: 0,
        timestamp: Date.now(),
        state: {},
      };

      const rootHash = await uploadMemory(emptyMemory);
      expect(rootHash).toBeDefined();
    });

    it("should throw on upload failure", async () => {
      const { Indexer } = await import("@0gfoundation/0g-ts-sdk");
      vi.mocked(Indexer).mockImplementationOnce(() => ({
        upload: vi.fn().mockResolvedValue([null, new Error("Upload failed")]),
        downloadToBlob: vi.fn(),
      }) as unknown as InstanceType<typeof Indexer>);

      await expect(uploadMemory(mockMemory)).rejects.toThrow(/upload failed/i);
    });
  });

  describe("downloadMemory", () => {
    it("should download and deserialize agent memory from root hash", async () => {
      const memory = await downloadMemory("0xrootHash123");

      expect(memory).toBeDefined();
      expect(memory.agentId).toBeDefined();
      expect(memory.agentType).toBeDefined();
      expect(memory.version).toBeGreaterThanOrEqual(0);
    });

    it("should throw on invalid root hash", async () => {
      const { Indexer } = await import("@0gfoundation/0g-ts-sdk");
      vi.mocked(Indexer).mockImplementationOnce(() => ({
        upload: vi.fn(),
        downloadToBlob: vi.fn().mockResolvedValue([null, new Error("Not found")]),
      }) as unknown as InstanceType<typeof Indexer>);

      await expect(downloadMemory("0xinvalid")).rejects.toThrow();
    });

    it("should validate deserialized memory structure", async () => {
      const memory = await downloadMemory("0xvalid");

      expect(memory).toHaveProperty("agentId");
      expect(memory).toHaveProperty("agentType");
      expect(memory).toHaveProperty("version");
      expect(memory).toHaveProperty("timestamp");
      expect(memory).toHaveProperty("state");
    });
  });
});
