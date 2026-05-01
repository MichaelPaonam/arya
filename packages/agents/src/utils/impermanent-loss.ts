export function calculateIL(priceRatio: number): number {
  if (priceRatio <= 0) {
    throw new Error("Price ratio must be positive");
  }

  // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
  // Returns as percentage (positive = loss)
  const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
  return Math.abs(il) * 100;
}
