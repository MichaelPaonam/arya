import { describe, it, expect } from "vitest";
import { calculateIL } from "./impermanent-loss.js";

describe("Impermanent Loss Calculator", () => {
  it("should return 0 IL when price ratio is 1 (no change)", () => {
    const il = calculateIL(1.0);
    expect(il).toBeCloseTo(0, 4);
  });

  it("should calculate correct IL for 2x price increase", () => {
    // Formula: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    // For 2x: 2 * sqrt(2) / (1 + 2) - 1 = 2*1.414/3 - 1 = -0.0572 => 5.72%
    const il = calculateIL(2.0);
    expect(il).toBeCloseTo(5.72, 1);
  });

  it("should calculate correct IL for 0.5x price decrease", () => {
    // Same IL for 2x and 0.5x (symmetric)
    const il = calculateIL(0.5);
    expect(il).toBeCloseTo(5.72, 1);
  });

  it("should calculate correct IL for 5x price increase", () => {
    // For 5x: 2 * sqrt(5) / (1 + 5) - 1 = 2*2.236/6 - 1 = -0.2546 => 25.46%
    const il = calculateIL(5.0);
    expect(il).toBeCloseTo(25.46, 0);
  });

  it("should return higher IL for larger price divergence", () => {
    const il2x = calculateIL(2.0);
    const il5x = calculateIL(5.0);
    const il10x = calculateIL(10.0);

    expect(il2x).toBeLessThan(il5x);
    expect(il5x).toBeLessThan(il10x);
  });

  it("should handle very small price ratios", () => {
    const il = calculateIL(0.01);
    expect(il).toBeGreaterThan(0);
    expect(il).toBeLessThan(100);
  });

  it("should throw for zero or negative price ratio", () => {
    expect(() => calculateIL(0)).toThrow();
    expect(() => calculateIL(-1)).toThrow();
  });
});
