import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TierBadge } from "./tier-badge";

describe("TierBadge", () => {
  it("renders the tier label", () => {
    render(<TierBadge tier="gold" />);
    expect(screen.getByText("gold")).toBeInTheDocument();
  });

  it("renders platinum style", () => {
    const { container } = render(<TierBadge tier="platinum" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-secondary");
  });

  it("renders bronze as fallback for unknown tier", () => {
    const { container } = render(<TierBadge tier="unknown" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("oklch");
  });
});
