import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "./defaults";
import type { Adjustments, AspectRatio, Geometry } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(255, value));
const clampUnit = (value: number) => Math.max(0, Math.min(1, value));
export type CropRect = { sx: number; sy: number; sw: number; sh: number };
const ratioValues: Record<Exclude<AspectRatio, "original" | "free">, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
};

export function getCropRect(
  width: number,
  height: number,
  aspectRatio: AspectRatio,
  geometry?: Partial<Geometry>,
): CropRect {
  if (aspectRatio === "free") {
    const cropX = clampUnit(geometry?.cropX ?? 0);
    const cropY = clampUnit(geometry?.cropY ?? 0);
    const cropWidth = Math.max(0.1, Math.min(1 - cropX, geometry?.cropWidth ?? 1));
    const cropHeight = Math.max(0.1, Math.min(1 - cropY, geometry?.cropHeight ?? 1));
    return {
      sx: width * cropX,
      sy: height * cropY,
      sw: width * cropWidth,
      sh: height * cropHeight,
    };
  }
  if (aspectRatio === "original") return { sx: 0, sy: 0, sw: width, sh: height };
  const target = ratioValues[aspectRatio];
  const current = width / height;
  if (current > target) {
    const sw = height * target;
    return { sx: (width - sw) / 2, sy: 0, sw, sh: height };
  }
  const sh = width / target;
  return { sx: 0, sy: (height - sh) / 2, sw: width, sh };
}

export function createToneCurveLut(input: Adjustments): Uint8ClampedArray {
  const adjustments = { ...DEFAULT_ADJUSTMENTS, ...input };
  const xs = [0, 64, 128, 192, 255];
  const ys = [
    0,
    clamp(64 + adjustments.curveShadows),
    clamp(128 + adjustments.curveMidtones),
    clamp(192 + adjustments.curveHighlights),
    255,
  ];
  const lut = new Uint8ClampedArray(256);
  for (let segment = 0; segment < xs.length - 1; segment += 1) {
    const startX = xs[segment];
    const endX = xs[segment + 1];
    const startY = ys[segment];
    const endY = ys[segment + 1];
    for (let value = startX; value <= endX; value += 1) {
      const progress = (value - startX) / Math.max(1, endX - startX);
      lut[value] = clamp(startY + (endY - startY) * progress);
    }
  }
  return lut;
}

type MixerName = "red" | "orange" | "yellow" | "green" | "aqua" | "blue" | "purple" | "magenta";
const mixerCenters: Array<{ name: MixerName; center: number }> = [
  { name: "red", center: 0 },
  { name: "orange", center: 30 },
  { name: "yellow", center: 60 },
  { name: "green", center: 120 },
  { name: "aqua", center: 180 },
  { name: "blue", center: 240 },
  { name: "purple", center: 280 },
  { name: "magenta", center: 320 },
];

export function rgbToHsl(red: number, green: number, blue: number) {
  const r = clamp(red) / 255;
  const g = clamp(green) / 255;
  const b = clamp(blue) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l: lightness };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  return { h: (hue + 360) % 360, s: saturation, l: lightness };
}

export function hslToRgb(hue: number, saturation: number, lightness: number) {
  const h = ((hue % 360) + 360) % 360;
  const s = clampUnit(saturation);
  const l = clampUnit(lightness);
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const offset = l - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [chroma, x, 0];
  else if (h < 120) [r, g, b] = [x, chroma, 0];
  else if (h < 180) [r, g, b] = [0, chroma, x];
  else if (h < 240) [r, g, b] = [0, x, chroma];
  else if (h < 300) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];
  return {
    r: clamp((r + offset) * 255),
    g: clamp((g + offset) * 255),
    b: clamp((b + offset) * 255),
  };
}

export function applyColorMixer(
  red: number,
  green: number,
  blue: number,
  input: Adjustments,
) {
  const adjustments = { ...DEFAULT_ADJUSTMENTS, ...input };
  const hsl = rgbToHsl(red, green, blue);
  if (hsl.s < 0.02) return { r: clamp(red), g: clamp(green), b: clamp(blue) };
  let totalWeight = 0;
  let hueShift = 0;
  let saturationShift = 0;
  let luminanceShift = 0;
  for (const mixer of mixerCenters) {
    const distance = Math.min(
      Math.abs(hsl.h - mixer.center),
      360 - Math.abs(hsl.h - mixer.center),
    );
    const weight = Math.max(0, 1 - distance / 50);
    if (!weight) continue;
    totalWeight += weight;
    const hueKey = `${mixer.name}Hue` as keyof Adjustments;
    const saturationKey = `${mixer.name}Saturation` as keyof Adjustments;
    const luminanceKey = `${mixer.name}Luminance` as keyof Adjustments;
    hueShift += adjustments[hueKey] * weight;
    saturationShift += adjustments[saturationKey] * weight;
    luminanceShift += adjustments[luminanceKey] * weight;
  }
  if (!totalWeight) return { r: clamp(red), g: clamp(green), b: clamp(blue) };
  return hslToRgb(
    hsl.h + (hueShift / totalWeight) * 0.3,
    hsl.s + (saturationShift / totalWeight) * 0.0075,
    hsl.l + (luminanceShift / totalWeight) * 0.0055,
  );
}

function applyColorGrade(
  red: number,
  green: number,
  blue: number,
  luminance: number,
  adjustments: Adjustments,
) {
  const balance = adjustments.gradingBalance / 100;
  const shadowWeight = clampUnit(1 - luminance / (128 + balance * 40));
  const highlightWeight = clampUnit((luminance - (110 + balance * 35)) / 145);
  const midtoneWeight = clampUnit(1 - Math.abs(luminance - 128) / 100);
  const wheels = [
    { hue: adjustments.shadowHue, saturation: adjustments.shadowSaturation, weight: shadowWeight },
    { hue: adjustments.midtoneHue, saturation: adjustments.midtoneSaturation, weight: midtoneWeight },
    { hue: adjustments.highlightHue, saturation: adjustments.highlightSaturation, weight: highlightWeight },
  ];
  let r = red;
  let g = green;
  let b = blue;
  for (const wheel of wheels) {
    const mix = clampUnit((wheel.saturation / 100) * wheel.weight * 0.45);
    if (!mix) continue;
    const target = hslToRgb(wheel.hue, Math.min(0.8, wheel.saturation / 100), luminance / 255);
    r = r * (1 - mix) + target.r * mix;
    g = g * (1 - mix) + target.g * mix;
    b = b * (1 - mix) + target.b * mix;
  }
  return { r, g, b };
}

export function processImageData(data: ImageData, input: Adjustments, seed = 17): ImageData {
  const adjustments = { ...DEFAULT_ADJUSTMENTS, ...input };
  const pixels = data.data;
  const exposure = Math.pow(2, adjustments.exposure);
  const contrastValue = Math.max(-254, Math.min(254, adjustments.contrast));
  const contrast = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
  const toneCurve = createToneCurveLut(adjustments);
  const gammaPower = Math.pow(2, -adjustments.gamma / 100);
  let random = seed >>> 0;
  const rand = () => {
    random = (1664525 * random + 1013904223) >>> 0;
    return random / 4294967296;
  };

  for (let index = 0; index < pixels.length; index += 4) {
    let red = pixels[index] * exposure;
    let green = pixels[index + 1] * exposure;
    let blue = pixels[index + 2] * exposure;
    const originalLuminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const shadowMask = 1 - Math.min(1, originalLuminance / 128);
    const highlightMask = Math.max(0, (originalLuminance - 128) / 127);
    const midtoneMask = clampUnit(1 - Math.abs(originalLuminance - 128) / 128);
    const shadowLift =
      adjustments.shadows * 1.15 * shadowMask +
      adjustments.shadowRecovery * 0.8 * shadowMask * shadowMask;
    const highlightShift =
      adjustments.highlights * 1.05 * highlightMask -
      adjustments.highlightRecovery * 0.72 * highlightMask * highlightMask;
    const endpoints = adjustments.whites * 0.18 - adjustments.blacks * 0.14;
    const dynamicCompression = adjustments.dynamicRange / 100;

    red += shadowLift + highlightShift + endpoints + adjustments.brightness * 1.05;
    green += shadowLift + highlightShift + endpoints + adjustments.brightness * 1.05;
    blue += shadowLift + highlightShift + endpoints + adjustments.brightness * 1.05;

    if (dynamicCompression !== 0) {
      const target = originalLuminance < 128 ? 128 : 155;
      const amount = Math.abs(dynamicCompression) * (originalLuminance < 128 ? shadowMask : highlightMask) * 0.42;
      const sign = dynamicCompression > 0 ? 1 : -1;
      red += (target - red) * amount * sign;
      green += (target - green) * amount * sign;
      blue += (target - blue) * amount * sign;
    }

    red = toneCurve[Math.round(clamp(contrast * (red - 128) + 128))];
    green = toneCurve[Math.round(clamp(contrast * (green - 128) + 128))];
    blue = toneCurve[Math.round(clamp(contrast * (blue - 128) + 128))];

    if (adjustments.gamma !== 0) {
      red = 255 * Math.pow(clamp(red) / 255, gammaPower);
      green = 255 * Math.pow(clamp(green) / 255, gammaPower);
      blue = 255 * Math.pow(clamp(blue) / 255, gammaPower);
    }

    const midtoneContrast = 1 + (adjustments.midtoneContrast / 100) * midtoneMask;
    red = 128 + (red - 128) * midtoneContrast;
    green = 128 + (green - 128) * midtoneContrast;
    blue = 128 + (blue - 128) * midtoneContrast;

    red += adjustments.temperature * 0.42 + adjustments.tint * 0.12;
    blue -= adjustments.temperature * 0.42;
    green -= adjustments.tint * 0.25;

    const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
    const saturation = 1 + (adjustments.saturation + adjustments.vibrance * 0.55) / 100;
    red = gray + (red - gray) * saturation;
    green = gray + (green - gray) * saturation;
    blue = gray + (blue - gray) * saturation;

    const mixed = applyColorMixer(red, green, blue, adjustments);
    red = mixed.r;
    green = mixed.g;
    blue = mixed.b;

    const gradedLuminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const graded = applyColorGrade(red, green, blue, gradedLuminance, adjustments);
    red = graded.r;
    green = graded.g;
    blue = graded.b;

    const presence = 1 + (adjustments.clarity + adjustments.dehaze * 0.7) / 180;
    red = 128 + (red - 128) * presence;
    green = 128 + (green - 128) * presence;
    blue = 128 + (blue - 128) * presence;

    if (adjustments.dehaze !== 0) {
      const hazeSaturation = 1 + adjustments.dehaze / 220;
      const hazeGray = 0.299 * red + 0.587 * green + 0.114 * blue;
      red = hazeGray + (red - hazeGray) * hazeSaturation;
      green = hazeGray + (green - hazeGray) * hazeSaturation;
      blue = hazeGray + (blue - hazeGray) * hazeSaturation;
    }

    if (adjustments.grain > 0) {
      const grain = (rand() - 0.5) * adjustments.grain * 0.85;
      red += grain;
      green += grain;
      blue += grain;
    }
    pixels[index] = clamp(red);
    pixels[index + 1] = clamp(green);
    pixels[index + 2] = clamp(blue);
  }
  return data;
}

export function applyDetailFilters(
  data: ImageData,
  width: number,
  height: number,
  sharpness: number,
  noiseReduction: number,
  texture = 0,
): ImageData {
  if (sharpness <= 0 && noiseReduction <= 0 && texture === 0) return data;
  const source = new Uint8ClampedArray(data.data);
  const softened = new Uint8ClampedArray(source);
  const noiseMix = Math.min(0.72, Math.max(0, noiseReduction / 100) * 0.72);
  if (noiseMix > 0) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          let total = 0;
          for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
              total += source[((y + offsetY) * width + (x + offsetX)) * 4 + channel];
            }
          }
          const average = total / 9;
          softened[index + channel] = clamp(
            source[index + channel] * (1 - noiseMix) + average * noiseMix,
          );
        }
      }
    }
  }
  const detailSource = noiseMix > 0 ? softened : source;
  const detailAmount = Math.max(-0.65, Math.min(1.8, sharpness / 70 + texture / 160));
  if (detailAmount !== 0) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          const left = detailSource[index - 4 + channel];
          const right = detailSource[index + 4 + channel];
          const top = detailSource[index - width * 4 + channel];
          const bottom = detailSource[index + width * 4 + channel];
          const localAverage = (left + right + top + bottom) / 4;
          data.data[index + channel] = clamp(
            detailSource[index + channel] +
              (detailSource[index + channel] - localAverage) * detailAmount,
          );
        }
        data.data[index + 3] = detailSource[index + 3];
      }
    }
  } else {
    data.data.set(detailSource);
  }
  return data;
}

export function applyVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
) {
  if (amount <= 0) return;
  const radius = Math.max(width, height) * 0.72;
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.18,
    width / 2,
    height / 2,
    radius,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.78, amount / 110)})`);
  context.save();
  context.globalCompositeOperation = "multiply";
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

export function renderToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvas: HTMLCanvasElement,
  input: Adjustments,
  inputGeometry: Geometry = DEFAULT_GEOMETRY,
  maxDimension = 1800,
) {
  const adjustments = { ...DEFAULT_ADJUSTMENTS, ...input };
  const geometry = { ...DEFAULT_GEOMETRY, ...inputGeometry };
  const crop = getCropRect(sourceWidth, sourceHeight, geometry.aspectRatio, geometry);
  const quarterTurn = geometry.rotation === 90 || geometry.rotation === 270;
  const visualWidth = quarterTurn ? crop.sh : crop.sw;
  const visualHeight = quarterTurn ? crop.sw : crop.sh;
  const scale = Math.min(1, maxDimension / Math.max(visualWidth, visualHeight));
  const width = Math.max(1, Math.round(visualWidth * scale));
  const height = Math.max(1, Math.round(visualHeight * scale));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D is unavailable");

  const rotation = geometry.rotation + geometry.straighten;
  const shearX = geometry.perspectiveX / 420;
  const shearY = geometry.perspectiveY / 420;
  context.save();
  context.translate(width / 2, height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.transform(1, shearY, shearX, 1, 0, 0);
  context.scale(geometry.flipX ? -1 : 1, geometry.flipY ? -1 : 1);
  context.drawImage(
    source,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    (-crop.sw * scale) / 2,
    (-crop.sh * scale) / 2,
    crop.sw * scale,
    crop.sh * scale,
  );
  context.restore();

  const data = context.getImageData(0, 0, width, height);
  const colorAdjusted = processImageData(data, adjustments);
  context.putImageData(
    applyDetailFilters(
      colorAdjusted,
      width,
      height,
      adjustments.sharpness,
      adjustments.noiseReduction,
      adjustments.texture,
    ),
    0,
    0,
  );
  applyVignette(context, width, height, adjustments.vignette);
  return { width, height, crop };
}
