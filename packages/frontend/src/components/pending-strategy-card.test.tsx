import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PendingStrategyCard } from "./pending-strategy-card";
import { mockPipelineState } from "@/mocks/pipeline-state";

const proposal = mockPipelineState.proposals[0];

describe("PendingStrategyCard", () => {
  it("renders Pending Approval eyebrow", () => {
    render(<PendingStrategyCard proposal={proposal} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText("Pending Approval")).toBeInTheDocument();
  });

  it("renders protocol and pool title", () => {
    render(<PendingStrategyCard proposal={proposal} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText("Aave v3 → USDC Lending")).toBeInTheDocument();
  });

  it("renders explanation text", () => {
    render(<PendingStrategyCard proposal={proposal} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText(/Route 18% of stable bucket/)).toBeInTheDocument();
  });

  it("renders risk score", () => {
    render(<PendingStrategyCard proposal={proposal} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText("2/10")).toBeInTheDocument();
  });

  it("renders estimated APY", () => {
    render(<PendingStrategyCard proposal={proposal} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText("8.42%")).toBeInTheDocument();
  });

  it("calls onApprove when Approve is clicked", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(<PendingStrategyCard proposal={proposal} onApprove={onApprove} onReject={() => {}} />);
    await user.click(screen.getByText("Approve"));
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("calls onReject when Reject is clicked", async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(<PendingStrategyCard proposal={proposal} onApprove={() => {}} onReject={onReject} />);
    await user.click(screen.getByText("Reject"));
    expect(onReject).toHaveBeenCalledOnce();
  });
});
