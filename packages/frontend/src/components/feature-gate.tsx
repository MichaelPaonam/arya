"use client";

import type { ReactNode } from "react";
import { useAppMode } from "@/hooks/use-app-mode";
import { isEnabled, type FeatureName } from "@/lib/feature-flags";

interface FeatureGateProps {
  feature: FeatureName;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { mode } = useAppMode();
  if (!isEnabled(feature, mode)) return <>{fallback}</>;
  return <>{children}</>;
}
