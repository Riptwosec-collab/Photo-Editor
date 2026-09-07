import type { Adjustments } from "../editor/types";

export type PixelAnalysis = {
  luminance: number;
  shadows: number;
  highlights: number;
  samples: number;
  changes: Partial<Adjustments>;
};

/** Measures visible original pixels; this is image statistics, not a trained vision model. */
export function analyzePixels(data: ArrayLike<number>): PixelAnalysis {
  let luminance = 0, shadows = 0, highlights = 0, samples = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const value = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
    luminance += value;
    if (value < 35) shadows++;
    if (value > 235) highlights++;
    samples++;
  }
  if (!samples) throw new Error("No visible pixels to analyze");
  luminance /= samples;
  const shadowRatio = shadows / samples;
  const highlightRatio = highlights / samples;
  // Bounded global suggestions deliberately avoid claims of face or object recognition.
  const exposure = Math.round(Math.max(-.65, Math.min(.65, Math.log2(118 / Math.max(1, luminance)) * .45)) * 100) / 100;
  return {
    luminance, shadows: shadowRatio * 100, highlights: highlightRatio * 100, samples,
    changes: { exposure, shadows: Math.round(Math.min(30, shadowRatio * 70)), highlights: -Math.round(Math.min(30, highlightRatio * 90)) },
  };
}

export async function analyzeImage(objectUrl: string): Promise<PixelAnalysis> {
  const image = new Image();
  image.src = objectUrl;
  await image.decode();
  const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image analysis is unavailable in this browser");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return analyzePixels(context.getImageData(0, 0, canvas.width, canvas.height).data);
}
