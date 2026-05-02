import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SetupPage from "./page";

vi.mock("@/hooks/use-wallet", () => ({
  useWalletMounted: () => true,
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x1234567890abcdef1234567890abcdef12345678", isConnected: true }),
  useWriteContract: () => ({ writeContract: vi.fn(), data: undefined, isPending: false, error: null }),
  useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: false }),
  useReadContract: () => ({ data: [], isLoading: false }),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  useConnectModal: () => ({ openConnectModal: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/app/setup",
}));

describe("SetupPage", () => {
  it("renders the setup wizard", () => {
    render(<SetupPage />);
    expect(screen.getByText("Initialize Your Swarm")).toBeInTheDocument();
  });

  it("shows ARYA header", () => {
    render(<SetupPage />);
    expect(screen.getByText("ARYA")).toBeInTheDocument();
  });

  it("shows deploy button on welcome step", () => {
    render(<SetupPage />);
    expect(screen.getByRole("button", { name: /deploy swarm/i })).toBeInTheDocument();
  });

  it("shows progress step dots", () => {
    render(<SetupPage />);
    const dots = screen.getAllByTestId("step-dot");
    expect(dots.length).toBe(4);
  });
});
