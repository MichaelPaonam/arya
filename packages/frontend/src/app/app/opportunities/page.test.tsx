import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import OpportunitiesPage from "./page";

const mockMode = vi.hoisted(() => ({ current: "full" as "hackathon" | "full" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/opportunities",
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

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("OpportunitiesPage — full mode", () => {
  beforeEach(() => { mockMode.current = "full"; });

  it("renders page title", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByText("Yield Opportunities")).toBeInTheDocument();
  });

  it("renders stat cards with values", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByText("Tracked Pools")).toBeInTheDocument();
    expect(screen.getByText("1,284")).toBeInTheDocument();
  });

  it("renders opportunities table", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByText("Aave v3")).toBeInTheDocument();
    expect(screen.getByText("Pendle")).toBeInTheDocument();
  });
});

describe("OpportunitiesPage — hackathon mode", () => {
  beforeEach(() => { mockMode.current = "hackathon"; });

  it("renders empty state title", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByText("No opportunities surfaced yet")).toBeInTheDocument();
  });

  it("renders placeholder stat labels", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByText("Best APY Found")).toBeInTheDocument();
    expect(screen.getByText("Pools Scanned")).toBeInTheDocument();
    expect(screen.getByText("Risk-Adjusted Score")).toBeInTheDocument();
    expect(screen.getByText("Time to Next Scan")).toBeInTheDocument();
  });

  it("does not render the opportunities table", () => {
    render(<OpportunitiesPage />);
    expect(screen.queryByText("Aave v3")).not.toBeInTheDocument();
  });
});
