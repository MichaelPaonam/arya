export type AppMode = "hackathon" | "full";

const FEATURES = {
  portfolioTracking: ["full"],
  historicalWinRate: ["full"],
  tierProgression: ["full"],
  leaderboard: ["full"],
  sessionKeys: ["full"],
  multipleVaults: ["full"],
  settingsPage: ["hackathon", "full"],
  historyPage: ["hackathon", "full"],
  vaultsPage: ["hackathon", "full"],
  opportunityDiscovery: ["hackathon", "full"],
  riskAssessment: ["hackathon", "full"],
  strategyApproval: ["hackathon", "full"],
  execution: ["hackathon", "full"],
} as const;

export type FeatureName = keyof typeof FEATURES;

export function isEnabled(feature: FeatureName, mode: AppMode): boolean {
  return (FEATURES[feature] as readonly string[]).includes(mode);
}

export function getEnabledFeatures(mode: AppMode): FeatureName[] {
  return (Object.keys(FEATURES) as FeatureName[]).filter((f) =>
    isEnabled(f, mode)
  );
}
