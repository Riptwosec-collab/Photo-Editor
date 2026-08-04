import type { Adjustments } from "./types";
import type { AutoEnhanceMode, DirectorDirection } from "@/features/studio/store";

export const AUTO_ENHANCE_RECIPES: Record<AutoEnhanceMode, Partial<Adjustments>> = {
  balanced: { exposure: 0.12, contrast: 8, highlights: -14, shadows: 16, vibrance: 8, clarity: 4 },
  natural: { exposure: 0.08, contrast: 3, highlights: -10, shadows: 12, vibrance: 4, saturation: -2 },
  portrait: { exposure: 0.16, highlights: -20, shadows: 18, temperature: 5, tint: 2, texture: -6, orangeLuminance: 5, noiseReduction: 7 },
  night: { exposure: 0.28, highlights: -34, shadows: 28, shadowRecovery: 24, noiseReduction: 26, dehaze: 9, temperature: -3 },
  vivid: { contrast: 14, vibrance: 22, saturation: 8, clarity: 8, dehaze: 6 },
  cinematic: { exposure: -0.06, contrast: 20, highlights: -26, shadows: 10, temperature: -6, shadowSaturation: 16, highlightSaturation: 10, vignette: 18, grain: 8 },
  professional: { contrast: 9, highlights: -18, shadows: 14, whites: 4, blacks: -5, texture: 5, sharpness: 14, noiseReduction: 8 },
  social: { exposure: 0.15, contrast: 12, vibrance: 18, orangeLuminance: 4, sharpness: 12, vignette: 8 },
  print: { exposure: 0.08, contrast: 7, highlights: -12, shadows: 8, whites: 6, sharpness: 18, grain: 0 },
};

export const DIRECTOR_RECIPES: Record<DirectorDirection, Partial<Adjustments>> = {
  natural: AUTO_ENHANCE_RECIPES.natural,
  premium: { exposure: 0.12, contrast: 12, highlights: -20, shadows: 18, temperature: 3, vibrance: 8, texture: 3, sharpness: 12 },
  cinematic: AUTO_ENHANCE_RECIPES.cinematic,
  dramatic: { exposure: -0.1, contrast: 28, highlights: -30, shadows: 6, blacks: -12, dehaze: 16, clarity: 18, vignette: 24, grain: 12 },
};

export function scaleRecipe(
  current: Adjustments,
  recipe: Partial<Adjustments>,
  intensity: number,
): Partial<Adjustments> {
  const amount = Math.max(0, Math.min(1, intensity / 100));
  return Object.fromEntries(
    Object.entries(recipe).map(([key, target]) => [
      key,
      current[key as keyof Adjustments] +
        (Number(target) - current[key as keyof Adjustments]) * amount,
    ]),
  ) as Partial<Adjustments>;
}

export type AverageColor = { r: number; g: number; b: number; luminance: number };

export function deriveColorMatch(
  current: AverageColor,
  reference: AverageColor,
  strength: number,
): Partial<Adjustments> {
  const amount = Math.max(0, Math.min(1, strength / 100));
  const exposureDelta = Math.log2((reference.luminance + 1) / (current.luminance + 1));
  const referenceWarmth = reference.r - reference.b;
  const currentWarmth = current.r - current.b;
  const referenceTint = (reference.r + reference.b) / 2 - reference.g;
  const currentTint = (current.r + current.b) / 2 - current.g;
  return {
    exposure: Math.max(-1.5, Math.min(1.5, exposureDelta * amount)),
    temperature: Math.max(-35, Math.min(35, (referenceWarmth - currentWarmth) * 0.22 * amount)),
    tint: Math.max(-30, Math.min(30, (referenceTint - currentTint) * 0.18 * amount)),
    vibrance: Math.max(-20, Math.min(20, (reference.luminance - current.luminance) * 0.08 * amount)),
  };
}
