"use client";
import { useEffect } from "react";
import { usePreferences } from "@/features/studio/preferences";
export function PreferencesEffects() {
  const motion = usePreferences((s) => s.reducedMotion);
  const performance = usePreferences((s) => s.performanceMode);
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? "reduced" : "system";
    document.documentElement.dataset.performance = performance ? "fast" : "quality";
  }, [motion, performance]);
  return null;
}
