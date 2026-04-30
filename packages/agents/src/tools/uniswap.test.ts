import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getSwapQuote, buildSwapCalldata, checkApproval } from "./uniswap.js";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const UNISWAP_BASE = "https://trade-api.gateway.uniswap.org/v1";

describe("Uniswap Tool", () => {
  describe("getSwapQuote", () => {
    it("should return a quote with route and gas estimate", async () => {
      server.use(
        http.post(`${UNISWAP_BASE}/quote`, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          expect(body["tokenIn"]).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
          expect(body["tokenOut"]).toBe("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
          return HttpResponse.json({
            quote: {
              amountOut: "1000000000000000000",
              gasEstimate: "150000",
              route: [{ protocol: "V3", percent: 100 }],
              priceImpact: 0.05,
            },
          });
        })
      );

      const quote = await getSwapQuote({
        tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        amount: "3200000000",
        chainId: 1,
      });

      expect(quote.amountOut).toBe("1000000000000000000");
      expect(quote.gasEstimate).toBe("150000");
      expect(quote.route).toHaveLength(1);
      expect(quote.priceImpact).toBeLessThan(1);
    });

    it("should reject quotes with excessive price impact", async () => {
      server.use(
        http.post(`${UNISWAP_BASE}/quote`, () => {
          return HttpResponse.json({
            quote: {
              amountOut: "500000000000000000",
              gasEstimate: "200000",
              route: [{ protocol: "V3", percent: 100 }],
              priceImpact: 15.0,
            },
          });
        })
      );

      await expect(
        getSwapQuote({
          tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          amount: "3200000000",
          chainId: 1,
          maxPriceImpact: 5.0,
        })
      ).rejects.toThrow(/price impact/i);
    });

    it("should handle API rate limits with retry", async () => {
      let callCount = 0;
      server.use(
        http.post(`${UNISWAP_BASE}/quote`, () => {
          callCount++;
          if (callCount === 1) {
            return new HttpResponse(null, { status: 429 });
          }
          return HttpResponse.json({
            quote: { amountOut: "1000000000000000000", gasEstimate: "150000", route: [], priceImpact: 0.01 },
          });
        })
      );

      const quote = await getSwapQuote({
        tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        amount: "3200000000",
        chainId: 1,
      });

      expect(callCount).toBe(2);
      expect(quote.amountOut).toBe("1000000000000000000");
    });
  });

  describe("buildSwapCalldata", () => {
    it("should return transaction calldata for an approved swap", async () => {
      server.use(
        http.post(`${UNISWAP_BASE}/swap`, () => {
          return HttpResponse.json({
            swap: {
              to: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
              data: "0xabcdef1234567890",
              value: "0",
              gasLimit: "200000",
            },
          });
        })
      );

      const tx = await buildSwapCalldata({
        tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        amount: "3200000000",
        chainId: 1,
        slippageTolerance: 0.5,
      });

      expect(tx.to).toBe("0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD");
      expect(tx.data).toMatch(/^0x/);
      expect(tx.gasLimit).toBe("200000");
    });
  });

  describe("checkApproval", () => {
    it("should return approval status for a token", async () => {
      server.use(
        http.post(`${UNISWAP_BASE}/check_approval`, () => {
          return HttpResponse.json({
            approval: {
              isApproved: true,
              allowance: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            },
          });
        })
      );

      const approval = await checkApproval({
        token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        amount: "3200000000",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        chainId: 1,
      });

      expect(approval.isApproved).toBe(true);
    });

    it("should indicate when approval is needed", async () => {
      server.use(
        http.post(`${UNISWAP_BASE}/check_approval`, () => {
          return HttpResponse.json({
            approval: {
              isApproved: false,
              allowance: "0",
              approvalTx: {
                to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                data: "0x095ea7b3...",
              },
            },
          });
        })
      );

      const approval = await checkApproval({
        token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        amount: "3200000000",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        chainId: 1,
      });

      expect(approval.isApproved).toBe(false);
      expect(approval.approvalTx).toBeDefined();
    });
  });
});
