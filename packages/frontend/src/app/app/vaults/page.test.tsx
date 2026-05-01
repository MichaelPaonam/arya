import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import VaultsPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/vaults",
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeToggle: () => <div>theme-toggle</div>,
}));

vi.mock("@/hooks/use-app-mode", () => ({
  useAppMode: () => ({ mode: "full", setMode: () => {} }),
  AppModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

describe("VaultsPage", () => {
  it("renders page title", () => {
    render(<VaultsPage />);
    expect(screen.getByText("Your Vaults")).toBeInTheDocument();
  });

  it("renders portfolio stats", () => {
    render(<VaultsPage />);
    expect(screen.getByText("Total Deposited")).toBeInTheDocument();
    expect(screen.getByText("$2.83M")).toBeInTheDocument();
    expect(screen.getByText("Lifetime Earned")).toBeInTheDocument();
    expect(screen.getByText("Blended APY")).toBeInTheDocument();
  });

  it("renders vault cards with vault names", () => {
    render(<VaultsPage />);
    expect(screen.getByText("Stable Core")).toBeInTheDocument();
    expect(screen.getByText("ETH Yield")).toBeInTheDocument();
    expect(screen.getByText("Fixed-Term Boost")).toBeInTheDocument();
    expect(screen.getByText("Frontier Alpha")).toBeInTheDocument();
  });

  it("renders TVL chart section", () => {
    render(<VaultsPage />);
    expect(screen.getByText("TVL · 30d")).toBeInTheDocument();
    expect(screen.getByText("Combined vault value")).toBeInTheDocument();
  });
});
