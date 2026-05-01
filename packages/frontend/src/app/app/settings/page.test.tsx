import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import SettingsPage from "./page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/settings",
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeToggle: () => <div>theme-toggle</div>,
}));

vi.mock("@/hooks/use-app-mode", () => ({
  useAppMode: () => ({ mode: "full", setMode: () => {} }),
  AppModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/use-wallet", () => ({
  useWalletMounted: () => false,
}));

describe("SettingsPage", () => {
  it("renders page title", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
  });

  it("renders wallet section with address", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Connected Wallet")).toBeInTheDocument();
    expect(screen.getByText(/0x84c2e1bb…5b9f31a/)).toBeInTheDocument();
  });

  it("renders risk limits section", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Risk Limits")).toBeInTheDocument();
    expect(screen.getByText("Max single position")).toBeInTheDocument();
    expect(screen.getByText("18%")).toBeInTheDocument();
  });

  it("renders notifications section", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Browser push")).toBeInTheDocument();
  });

  it("renders session keys with agent names", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Session Keys")).toBeInTheDocument();
    expect(screen.getByText("Atlas")).toBeInTheDocument();
    expect(screen.getByText("Helios")).toBeInTheDocument();
  });

  it("renders danger zone", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(screen.getByText("Pause swarm")).toBeInTheDocument();
  });

  it("renders LLM configuration card", () => {
    render(<SettingsPage />);
    expect(screen.getByText("LLM Configuration")).toBeInTheDocument();
  });

  it("renders provider options", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("OpenRouter")).toBeInTheDocument();
  });

  it("renders model selector", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Model")).toBeInTheDocument();
  });
});
