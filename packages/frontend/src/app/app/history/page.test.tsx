import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import HistoryPage from "./page";

const mockMode = vi.hoisted(() => ({ current: "full" as "hackathon" | "full" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/history",
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

describe("HistoryPage — full mode", () => {
  beforeEach(() => { mockMode.current = "full"; });

  it("renders page title", () => {
    render(<HistoryPage />);
    expect(screen.getByText("Activity History")).toBeInTheDocument();
  });

  it("renders stat cards", () => {
    render(<HistoryPage />);
    expect(screen.getByText("Actions · 30d")).toBeInTheDocument();
    expect(screen.getByText("248")).toBeInTheDocument();
    expect(screen.getByText("Approval Rate")).toBeInTheDocument();
    expect(screen.getByText("92.4%")).toBeInTheDocument();
  });

  it("renders event entries with agent names", () => {
    render(<HistoryPage />);
    expect(screen.getAllByText("Helios").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Atlas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nyx").length).toBeGreaterThan(0);
  });

  it("renders status badges", () => {
    render(<HistoryPage />);
    expect(screen.getAllByText("Executed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rejected").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
  });
});

describe("HistoryPage — hackathon mode", () => {
  beforeEach(() => { mockMode.current = "hackathon"; });

  it("renders empty state title", () => {
    render(<HistoryPage />);
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("renders placeholder stat labels", () => {
    render(<HistoryPage />);
    expect(screen.getByText("Total Transactions")).toBeInTheDocument();
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
    expect(screen.getByText("Gas Spent")).toBeInTheDocument();
    expect(screen.getByText("Last Activity")).toBeInTheDocument();
  });

  it("does not render event list", () => {
    render(<HistoryPage />);
    expect(screen.queryByText("Helios")).not.toBeInTheDocument();
    expect(screen.queryByText("Transaction History")).not.toBeInTheDocument();
  });
});
