import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SetupWizard } from "./setup-wizard";

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x1234567890abcdef1234567890abcdef12345678", isConnected: true }),
  useWriteContract: () => ({ writeContract: vi.fn(), data: "0xmockhash", isPending: false, error: null }),
  useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: true }),
  useReadContract: () => ({ data: [], isLoading: false }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe("SetupWizard", () => {
  it("renders welcome step initially", () => {
    render(<SetupWizard />);
    expect(screen.getByText(/initialize your swarm/i)).toBeInTheDocument();
  });

  it("shows 4 progress dots", () => {
    render(<SetupWizard />);
    const dots = screen.getAllByTestId("step-dot");
    expect(dots.length).toBe(4);
  });

  it("advances to smart account step when deploy is clicked", () => {
    render(<SetupWizard />);
    fireEvent.click(screen.getByRole("button", { name: /deploy/i }));
    expect(screen.getByRole("heading", { name: /smart account/i })).toBeInTheDocument();
  });

  it("shows account created confirmation when tx succeeds", () => {
    render(<SetupWizard />);
    fireEvent.click(screen.getByRole("button", { name: /deploy/i }));
    expect(screen.getByText(/account created/i)).toBeInTheDocument();
  });

  it("shows all 4 agent cards in minting step", () => {
    render(<SetupWizard />);
    fireEvent.click(screen.getByRole("button", { name: /deploy/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("heading", { name: /provisioning agents/i })).toBeInTheDocument();
    expect(screen.getByText("Scout")).toBeInTheDocument();
    expect(screen.getByText("Risk")).toBeInTheDocument();
    expect(screen.getByText("Orchestrator")).toBeInTheDocument();
    expect(screen.getByText("Executor")).toBeInTheDocument();
  });

  it("shows LLM config step", () => {
    render(<SetupWizard />);
    fireEvent.click(screen.getByRole("button", { name: /deploy/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("heading", { name: /power your agents/i })).toBeInTheDocument();
  });

  it("shows completion step with enter button", () => {
    render(<SetupWizard />);
    fireEvent.click(screen.getByRole("button", { name: /deploy/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    // Click "Free Managed Tier" then "Continue"
    fireEvent.click(screen.getByText(/free managed tier/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("heading", { name: /your swarm is ready/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enter/i })).toBeInTheDocument();
  });
});
