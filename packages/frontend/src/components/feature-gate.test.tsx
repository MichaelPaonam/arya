import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureGate } from "./feature-gate";
import { AppModeProvider } from "@/hooks/use-app-mode";

function renderWithMode(ui: React.ReactElement) {
  return render(<AppModeProvider>{ui}</AppModeProvider>);
}

describe("FeatureGate", () => {
  it("renders children when feature is enabled in hackathon mode", () => {
    renderWithMode(
      <FeatureGate feature="opportunityDiscovery">
        <span>Visible</span>
      </FeatureGate>
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("renders nothing when feature is disabled in hackathon mode", () => {
    renderWithMode(
      <FeatureGate feature="portfolioTracking">
        <span>Hidden</span>
      </FeatureGate>
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders fallback when feature is disabled", () => {
    renderWithMode(
      <FeatureGate feature="settingsPage" fallback={<span>Coming soon</span>}>
        <span>Settings</span>
      </FeatureGate>
    );
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
