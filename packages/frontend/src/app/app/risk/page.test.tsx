import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import RiskPage from "./page";

const mockMode = vi.hoisted(() => ({ current: "full" as "hackathon" | "full" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/risk",
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
  RadarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("RiskPage — full mode", () => {
  beforeEach(() => { mockMode.current = "full"; });

  it("renders page title", () => {
    render(<RiskPage />);
    expect(screen.getByText("Portfolio Risk")).toBeInTheDocument();
  });

  it("renders stat cards", () => {
    render(<RiskPage />);
    expect(screen.getByText("Composite Risk")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
  });

  it("renders alerts", () => {
    render(<RiskPage />);
    expect(screen.getByText("Ethena collateral concentration")).toBeInTheDocument();
  });
});

describe("RiskPage — hackathon mode", () => {
  beforeEach(() => { mockMode.current = "hackathon"; });

  it("renders empty state title", () => {
    render(<RiskPage />);
    expect(screen.getByText("Risk radar will calibrate after your first deposit")).toBeInTheDocument();
  });

  it("renders placeholder stat labels", () => {
    render(<RiskPage />);
    expect(screen.getByText("Portfolio Health")).toBeInTheDocument();
    expect(screen.getByText("IL Exposure")).toBeInTheDocument();
    expect(screen.getByText("Contract Risk")).toBeInTheDocument();
    expect(screen.getByText("Liquidity Score")).toBeInTheDocument();
  });

  it("does not render alerts or charts", () => {
    render(<RiskPage />);
    expect(screen.queryByText("Ethena collateral concentration")).not.toBeInTheDocument();
    expect(screen.queryByText("Six-vector risk signature")).not.toBeInTheDocument();
  });
});
