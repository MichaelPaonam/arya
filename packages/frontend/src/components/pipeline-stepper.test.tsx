import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PipelineStepper } from "./pipeline-stepper";

describe("PipelineStepper", () => {
  it("renders all 5 phase labels", () => {
    render(<PipelineStepper currentPhase="scout" isLoading={false} />);
    expect(screen.getByText("Scanning")).toBeInTheDocument();
    expect(screen.getByText("Assessing")).toBeInTheDocument();
    expect(screen.getByText("Debating")).toBeInTheDocument();
    expect(screen.getByText("Proposing")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("shows completed state when phase is complete", () => {
    render(<PipelineStepper currentPhase="complete" isLoading={false} />);
    const labels = screen.getAllByText(/Scanning|Assessing|Debating|Proposing|Ready/);
    labels.forEach((label) => {
      expect(label).toHaveClass("text-tertiary");
    });
  });

  it("renders without crashing when loading", () => {
    render(<PipelineStepper currentPhase={null} isLoading={true} />);
    expect(screen.getByText("Scanning")).toBeInTheDocument();
  });
});
