import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PlaceholderStat } from "./placeholder-stat";

describe("PlaceholderStat", () => {
  it("renders the label", () => {
    render(<PlaceholderStat label="Portfolio Value" />);
    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
  });

  it("renders an em-dash as the placeholder value", () => {
    render(<PlaceholderStat label="APY" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders hint text when provided", () => {
    render(<PlaceholderStat label="APY" hint="After first deposit" />);
    expect(screen.getByText("After first deposit")).toBeInTheDocument();
  });

  it("does not render hint when omitted", () => {
    const { container } = render(<PlaceholderStat label="APY" />);
    expect(container.querySelector("[data-testid='stat-hint']")).not.toBeInTheDocument();
  });
});
