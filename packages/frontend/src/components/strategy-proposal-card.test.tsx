import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrategyProposalCard } from "./strategy-proposal-card";
import { mockPipelineState } from "@/mocks/pipeline-state";

const proposal = mockPipelineState.proposals[0];

describe("StrategyProposalCard", () => {
  it("renders proposal protocol and pool", () => {
    render(<StrategyProposalCard proposal={proposal} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText("Aave v3 → USDC Lending")).toBeInTheDocument();
  });

  it("renders estimated APY", () => {
    render(<StrategyProposalCard proposal={proposal} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText("8.42%")).toBeInTheDocument();
  });

  it("renders risk score", () => {
    render(<StrategyProposalCard proposal={proposal} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText("2/10")).toBeInTheDocument();
  });

  it("calls onApprove when Approve is clicked", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(<StrategyProposalCard proposal={proposal} onApprove={onApprove} onReject={() => {}} />);
    await user.click(screen.getByText("Approve"));
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("calls onReject when Reject is clicked", async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(<StrategyProposalCard proposal={proposal} onApprove={() => {}} onReject={onReject} />);
    await user.click(screen.getByText("Reject"));
    expect(onReject).toHaveBeenCalledOnce();
  });
});
