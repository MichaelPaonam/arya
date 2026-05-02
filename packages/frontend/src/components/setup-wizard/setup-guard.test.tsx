import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetupGuard } from "./setup-guard";

const mockReplace = vi.fn();
let mockPathname = "/app";
let mockMounted = true;
let mockIsConnected = true;
let mockSwarmMembers: unknown[] = [];
let mockIsReadLoading = false;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}));

vi.mock("@/hooks/use-wallet", () => ({
  useWalletMounted: () => mockMounted,
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x1234567890abcdef1234567890abcdef12345678", isConnected: mockIsConnected }),
  useReadContract: () => ({ data: mockSwarmMembers, isLoading: mockIsReadLoading }),
}));

describe("SetupGuard", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPathname = "/app";
    mockMounted = true;
    mockIsConnected = true;
    mockSwarmMembers = [];
    mockIsReadLoading = false;
    localStorage.clear();
  });

  it("redirects to /app/setup when connected but not initialized", () => {
    render(<SetupGuard><div>child</div></SetupGuard>);
    expect(mockReplace).toHaveBeenCalledWith("/app/setup");
  });

  it("does not redirect when already initialized", () => {
    localStorage.setItem("arya-swarm-initialized", "true");
    render(<SetupGuard><div>child</div></SetupGuard>);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when wallet not connected", () => {
    mockIsConnected = false;
    render(<SetupGuard><div>child</div></SetupGuard>);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when wallet not mounted", () => {
    mockMounted = false;
    render(<SetupGuard><div>child</div></SetupGuard>);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when already on setup page", () => {
    mockPathname = "/app/setup";
    render(<SetupGuard><div>child</div></SetupGuard>);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when user has on-chain agents", () => {
    mockSwarmMembers = [{ tokenId: 1 }, { tokenId: 2 }];
    render(<SetupGuard><div>child</div></SetupGuard>);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(localStorage.getItem("arya-swarm-initialized")).toBe("true");
  });

  it("does not redirect when on-chain query is still loading", () => {
    mockIsReadLoading = true;
    render(<SetupGuard><div>child</div></SetupGuard>);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders children regardless of state", () => {
    render(<SetupGuard><div>child content</div></SetupGuard>);
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
