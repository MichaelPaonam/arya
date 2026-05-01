import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import HistoryPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/history",
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeToggle: () => <div>theme-toggle</div>,
}));

vi.mock("@/hooks/use-app-mode", () => ({
  useAppMode: () => ({ mode: "full", setMode: () => {} }),
  AppModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("HistoryPage", () => {
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
