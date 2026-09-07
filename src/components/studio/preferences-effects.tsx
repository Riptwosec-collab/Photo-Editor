"use client";
import { useEffect } from "react";
import { usePreferences } from "@/features/studio/preferences";
export function PreferencesEffects() {
  const theme = usePreferences((s) => s.theme);
  const language = usePreferences((s) => s.language);
  const height = usePreferences((s) => s.panelHeight);
  const motion = usePreferences((s) => s.reducedMotion);
  const performance = usePreferences((s) => s.performanceMode);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    document.documentElement.style.setProperty("--mobile-panel-height", `${height}dvh`);
    document.documentElement.dataset.motion = motion ? "reduced" : "system";
    document.documentElement.dataset.performance = performance ? "fast" : "quality";
  }, [motion, performance, theme, language, height]);
  return null;
}
