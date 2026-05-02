import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import CommandCenterPage from "./page";

const mockMode = vi.hoisted(() => ({ current: "full" as "hackathon" | "full" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
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

vi.mock("@/hooks/use-pipeline", () => ({
  usePipeline: () => ({ state: null, isLoading: false, error: null, events: [], currentPhase: null, trigger: vi.fn(), reset: vi.fn() }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("CommandCenterPage — full mode", () => {
  beforeEach(() => { mockMode.current = "full"; });

  it("renders page title", () => {
    render(<CommandCenterPage />);
    expect(screen.getByText("Yield Swarm Overview")).toBeInTheDocument();
  });

  it("renders stat cards with values", () => {
    render(<CommandCenterPage />);
    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
    expect(screen.getByText("$2.847M")).toBeInTheDocument();
  });

  it("renders opportunities table", () => {
    render(<CommandCenterPage />);
    expect(screen.getByText("Swarm Picks")).toBeInTheDocument();
    expect(screen.getByText("Aave v3")).toBeInTheDocument();
  });
});

describe("CommandCenterPage — hackathon mode", () => {
  beforeEach(() => { mockMode.current = "hackathon"; });

  it("renders empty state title", () => {
    render(<CommandCenterPage />);
    expect(screen.getByText("Your portfolio is empty")).toBeInTheDocument();
  });

  it("renders placeholder stat labels", () => {
    render(<CommandCenterPage />);
    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
    expect(screen.getByText("Aggregate APY")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    expect(screen.getByText("Active Vaults")).toBeInTheDocument();
  });

  it("does not render the opportunities table", () => {
    render(<CommandCenterPage />);
    expect(screen.queryByText("Swarm Picks")).not.toBeInTheDocument();
  });
});
