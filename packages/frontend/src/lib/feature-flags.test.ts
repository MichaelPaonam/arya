import { describe, it, expect } from "vitest";
import { isEnabled, getEnabledFeatures } from "./feature-flags";

describe("feature-flags", () => {
  describe("isEnabled", () => {
    it("returns true for hackathon-enabled features in hackathon mode", () => {
      expect(isEnabled("opportunityDiscovery", "hackathon")).toBe(true);
      expect(isEnabled("riskAssessment", "hackathon")).toBe(true);
      expect(isEnabled("strategyApproval", "hackathon")).toBe(true);
      expect(isEnabled("execution", "hackathon")).toBe(true);
    });

    it("returns false for full-only features in hackathon mode", () => {
      expect(isEnabled("portfolioTracking", "hackathon")).toBe(false);
      expect(isEnabled("historicalWinRate", "hackathon")).toBe(false);
      expect(isEnabled("tierProgression", "hackathon")).toBe(false);
      expect(isEnabled("leaderboard", "hackathon")).toBe(false);
      expect(isEnabled("settingsPage", "hackathon")).toBe(false);
      expect(isEnabled("historyPage", "hackathon")).toBe(false);
      expect(isEnabled("vaultsPage", "hackathon")).toBe(false);
    });

    it("returns true for all features in full mode", () => {
      expect(isEnabled("portfolioTracking", "full")).toBe(true);
      expect(isEnabled("opportunityDiscovery", "full")).toBe(true);
      expect(isEnabled("historyPage", "full")).toBe(true);
      expect(isEnabled("settingsPage", "full")).toBe(true);
    });
  });

  describe("getEnabledFeatures", () => {
    it("returns only hackathon features in hackathon mode", () => {
      const features = getEnabledFeatures("hackathon");
      expect(features).toContain("opportunityDiscovery");
      expect(features).toContain("riskAssessment");
      expect(features).not.toContain("portfolioTracking");
      expect(features).not.toContain("historyPage");
    });

    it("returns all features in full mode", () => {
      const features = getEnabledFeatures("full");
      expect(features).toContain("portfolioTracking");
      expect(features).toContain("opportunityDiscovery");
      expect(features).toContain("historyPage");
      expect(features.length).toBe(13);
    });
  });
});
