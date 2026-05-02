import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import AgentsPage from "./page";

const mockMode = vi.hoisted(() => ({ current: "full" as "hackathon" | "full" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/agents",
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
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

describe("AgentsPage — full mode", () => {
  beforeEach(() => { mockMode.current = "full"; });

  it("renders page title", () => {
    render(<AgentsPage />);
    expect(screen.getByRole("heading", { name: "Agents" })).toBeInTheDocument();
  });

  it("renders swarm stats with data", () => {
    render(<AgentsPage />);
    expect(screen.getByText("$2.83M")).toBeInTheDocument();
    expect(screen.getByText("83.3%")).toBeInTheDocument();
  });

  it("renders agent role cards", () => {
    render(<AgentsPage />);
    expect(screen.getByRole("heading", { name: "Scout" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Risk" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orchestrator" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Executor" })).toBeInTheDocument();
  });
});

describe("AgentsPage — hackathon mode", () => {
  beforeEach(() => { mockMode.current = "hackathon"; });

  it("renders page title", () => {
    render(<AgentsPage />);
    expect(screen.getByRole("heading", { name: "Agents" })).toBeInTheDocument();
  });

  it("shows freshly provisioned stats", () => {
    render(<AgentsPage />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows all agents as idle", () => {
    render(<AgentsPage />);
    const idleBadges = screen.getAllByText("idle");
    expect(idleBadges.length).toBe(4);
  });

  it("shows awaiting first scan message", () => {
    render(<AgentsPage />);
    expect(screen.getByText(/awaiting first scan/i)).toBeInTheDocument();
  });

  it("renders all 4 agent role cards", () => {
    render(<AgentsPage />);
    expect(screen.getByRole("heading", { name: "Scout" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Risk" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orchestrator" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Executor" })).toBeInTheDocument();
  });
});
