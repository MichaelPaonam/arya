import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "./risk-badge";

describe("RiskBadge", () => {
  it("renders low risk label", () => {
    render(<RiskBadge level="low" />);
    expect(screen.getByText("low")).toBeInTheDocument();
  });

  it("renders medium risk label", () => {
    render(<RiskBadge level="medium" />);
    expect(screen.getByText("medium")).toBeInTheDocument();
  });

  it("renders high risk label", () => {
    render(<RiskBadge level="high" />);
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("applies correct color class for low risk", () => {
    const { container } = render(<RiskBadge level="low" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-tertiary");
  });

  it("applies correct color class for high risk", () => {
    const { container } = render(<RiskBadge level="high" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-destructive");
  });
});
