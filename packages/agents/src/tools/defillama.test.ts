import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { fetchPools, fetchPoolHistory, fetchTokenPrices } from "./defillama.js";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("DefiLlama Tool", () => {
  describe("fetchPools", () => {
    it("should return validated pool data sorted by APY", async () => {
      server.use(
        http.get("https://yields.llama.fi/pools", () => {
          return HttpResponse.json({
            status: "success",
            data: [
              {
                pool: "pool-1",
                chain: "Ethereum",
                project: "uniswap-v3",
                symbol: "USDC-ETH",
                tvlUsd: 50_000_000,
                apy: 12.5,
                apyBase: 8.0,
                apyReward: 4.5,
              },
              {
                pool: "pool-2",
                chain: "Ethereum",
                project: "aave-v3",
                symbol: "USDC",
                tvlUsd: 200_000_000,
                apy: 5.2,
                apyBase: 5.2,
                apyReward: 0,
              },
            ],
          });
        })
      );

      const pools = await fetchPools({ minTvl: 10_000_000, limit: 10 });

      expect(pools).toHaveLength(2);
      expect(pools[0]!.apy).toBeGreaterThanOrEqual(pools[1]!.apy);
      expect(pools[0]!.pool).toBe("pool-1");
      expect(pools[0]!.tvlUsd).toBeGreaterThanOrEqual(10_000_000);
    });

    it("should filter pools below minimum TVL", async () => {
      server.use(
        http.get("https://yields.llama.fi/pools", () => {
          return HttpResponse.json({
            status: "success",
            data: [
              { pool: "small-pool", chain: "Ethereum", project: "unknown", symbol: "X-Y", tvlUsd: 500, apy: 100 },
              { pool: "big-pool", chain: "Ethereum", project: "aave-v3", symbol: "USDC", tvlUsd: 50_000_000, apy: 5 },
            ],
          });
        })
      );

      const pools = await fetchPools({ minTvl: 1_000_000, limit: 10 });

      expect(pools).toHaveLength(1);
      expect(pools[0]!.pool).toBe("big-pool");
    });

    it("should handle API errors gracefully", async () => {
      server.use(
        http.get("https://yields.llama.fi/pools", () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(fetchPools({ minTvl: 0, limit: 10 })).rejects.toThrow();
    });

    it("should respect the limit parameter", async () => {
      server.use(
        http.get("https://yields.llama.fi/pools", () => {
          return HttpResponse.json({
            status: "success",
            data: Array.from({ length: 50 }, (_, i) => ({
              pool: `pool-${i}`,
              chain: "Ethereum",
              project: "uniswap-v3",
              symbol: "USDC-ETH",
              tvlUsd: 10_000_000,
              apy: 50 - i,
            })),
          });
        })
      );

      const pools = await fetchPools({ minTvl: 0, limit: 5 });
      expect(pools).toHaveLength(5);
    });
  });

  describe("fetchPoolHistory", () => {
    it("should return historical APY data for a pool", async () => {
      server.use(
        http.get("https://yields.llama.fi/chart/:poolId", ({ params }) => {
          expect(params["poolId"]).toBe("pool-123");
          return HttpResponse.json({
            status: "success",
            data: [
              { timestamp: "2026-04-01T00:00:00.000Z", tvlUsd: 45_000_000, apy: 11.2 },
              { timestamp: "2026-04-02T00:00:00.000Z", tvlUsd: 46_000_000, apy: 11.8 },
              { timestamp: "2026-04-03T00:00:00.000Z", tvlUsd: 47_000_000, apy: 12.1 },
            ],
          });
        })
      );

      const history = await fetchPoolHistory("pool-123");

      expect(history).toHaveLength(3);
      expect(history[0]!.apy).toBe(11.2);
      expect(history[2]!.tvlUsd).toBe(47_000_000);
    });

    it("should handle non-existent pool", async () => {
      server.use(
        http.get("https://yields.llama.fi/chart/:poolId", () => {
          return HttpResponse.json({ status: "success", data: [] });
        })
      );

      const history = await fetchPoolHistory("nonexistent");
      expect(history).toHaveLength(0);
    });
  });

  describe("fetchTokenPrices", () => {
    it("should return current prices for token addresses", async () => {
      server.use(
        http.get("https://coins.llama.fi/prices/current/:coins", ({ params }) => {
          return HttpResponse.json({
            coins: {
              "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { price: 1.0, symbol: "USDC" },
              "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { price: 3200.5, symbol: "WETH" },
            },
          });
        })
      );

      const prices = await fetchTokenPrices([
        "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ]);

      expect(prices).toHaveLength(2);
      expect(prices.find((p) => p.symbol === "USDC")!.price).toBe(1.0);
      expect(prices.find((p) => p.symbol === "WETH")!.price).toBe(3200.5);
    });

    it("should handle missing token gracefully", async () => {
      server.use(
        http.get("https://coins.llama.fi/prices/current/:coins", () => {
          return HttpResponse.json({ coins: {} });
        })
      );

      const prices = await fetchTokenPrices(["ethereum:0xdead"]);
      expect(prices).toHaveLength(0);
    });
  });
});
