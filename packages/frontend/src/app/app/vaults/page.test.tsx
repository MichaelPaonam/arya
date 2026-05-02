import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import VaultsPage from "./page";

const mockMode = vi.hoisted(() => ({ current: "full" as "hackathon" | "full" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/vaults",
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeToggle: () => <div>theme-toggle</div>,
}));

vi.mock("@/hooks/use-app-mode", () => ({
  useAppMode: () => ({ mode: mockMode.current, setMode: vi.fn() }),
  AppModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/use-wallet", () => ({
  useWalletMounted: () => false,
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

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("VaultsPage — full mode", () => {
  beforeEach(() => { mockMode.current = "full"; });

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

describe("VaultsPage — hackathon mode", () => {
  beforeEach(() => { mockMode.current = "hackathon"; });

  it("renders empty state title", () => {
    render(<VaultsPage />);
    expect(screen.getByText("Open your first strategy vault")).toBeInTheDocument();
  });

  it("renders placeholder stat labels", () => {
    render(<VaultsPage />);
    expect(screen.getByText("Total Deposited")).toBeInTheDocument();
    expect(screen.getByText("Active Vaults")).toBeInTheDocument();
    expect(screen.getByText("Avg. APY")).toBeInTheDocument();
    expect(screen.getByText("Best Performer")).toBeInTheDocument();
  });

  it("does not render vault cards", () => {
    render(<VaultsPage />);
    expect(screen.queryByText("Stable Core")).not.toBeInTheDocument();
    expect(screen.queryByText("TVL · 30d")).not.toBeInTheDocument();
  });
});
