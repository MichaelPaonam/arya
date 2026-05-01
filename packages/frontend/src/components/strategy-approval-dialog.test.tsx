import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrategyApprovalDialog } from "./strategy-approval-dialog";
import { mockPipelineState } from "@/mocks/pipeline-state";

const proposal = mockPipelineState.proposals[0];

describe("StrategyApprovalDialog", () => {
  it("renders dialog title when open", () => {
    render(
      <StrategyApprovalDialog
        proposal={proposal}
        open={true}
        onOpenChange={() => {}}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );
    expect(screen.getByText("Strategy Ready")).toBeInTheDocument();
  });

  it("renders protocol and pool", () => {
    render(
      <StrategyApprovalDialog
        proposal={proposal}
        open={true}
        onOpenChange={() => {}}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );
    expect(screen.getByText("Aave v3 → USDC Lending")).toBeInTheDocument();
  });

  it("renders APY stat", () => {
    render(
      <StrategyApprovalDialog
        proposal={proposal}
        open={true}
        onOpenChange={() => {}}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );
    expect(screen.getByText("8.42%")).toBeInTheDocument();
  });

  it("calls onApprove when Approve is clicked", async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();
    render(
      <StrategyApprovalDialog
        proposal={proposal}
        open={true}
        onOpenChange={() => {}}
        onApprove={onApprove}
        onReject={() => {}}
      />
    );
    await user.click(screen.getByText("Approve"));
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("calls onReject when Reject is clicked", async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(
      <StrategyApprovalDialog
        proposal={proposal}
        open={true}
        onOpenChange={() => {}}
        onApprove={() => {}}
        onReject={onReject}
      />
    );
    await user.click(screen.getByText("Reject"));
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("does not render content when closed", () => {
    render(
      <StrategyApprovalDialog
        proposal={proposal}
        open={false}
        onOpenChange={() => {}}
        onApprove={() => {}}
        onReject={() => {}}
      />
    );
    expect(screen.queryByText("Strategy Ready")).not.toBeInTheDocument();
  });
});
