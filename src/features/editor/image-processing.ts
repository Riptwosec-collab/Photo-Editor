import { DEFAULT_GEOMETRY } from "./defaults";
import type { Adjustments, AspectRatio, Geometry } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(255, value));

export type CropRect = { sx: number; sy: number; sw: number; sh: number };

const ratioValues: Record<Exclude<AspectRatio, "original">, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
};

export function getCropRect(width: number, height: number, aspectRatio: AspectRatio): CropRect {
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

export function processImageData(data: ImageData, adjustments: Adjustments, seed = 17): ImageData {
  const pixels = data.data;
  const exposure = Math.pow(2, adjustments.exposure);
  const contrast =
    (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
  let random = seed >>> 0;
  const rand = () => {
    random = (1664525 * random + 1013904223) >>> 0;
    return random / 4294967296;
  };

  for (let index = 0; index < pixels.length; index += 4) {
    let red = pixels[index] * exposure;
    let green = pixels[index + 1] * exposure;
    let blue = pixels[index + 2] * exposure;
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const shadowMask = 1 - Math.min(1, luminance / 128);
    const highlightMask = Math.max(0, (luminance - 128) / 127);
    const shadowLift = adjustments.shadows * 1.15 * shadowMask;
    const highlightShift = adjustments.highlights * 1.05 * highlightMask;
    const endpoints = adjustments.whites * 0.18 - adjustments.blacks * 0.14;

    red += shadowLift + highlightShift + endpoints;
    green += shadowLift + highlightShift + endpoints;
    blue += shadowLift + highlightShift + endpoints;
    red = contrast * (red - 128) + 128;
    green = contrast * (green - 128) + 128;
    blue = contrast * (blue - 128) + 128;
    red += adjustments.temperature * 0.42 + adjustments.tint * 0.12;
    blue -= adjustments.temperature * 0.42;
    green -= adjustments.tint * 0.25;

    const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
    const saturation = 1 + (adjustments.saturation + adjustments.vibrance * 0.55) / 100;
    red = gray + (red - gray) * saturation;
    green = gray + (green - gray) * saturation;
    blue = gray + (blue - gray) * saturation;

    const clarity = 1 + adjustments.clarity / 180;
    red = 128 + (red - 128) * clarity;
    green = 128 + (green - 128) * clarity;
    blue = 128 + (blue - 128) * clarity;

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
  adjustments: Adjustments,
  geometry: Geometry = DEFAULT_GEOMETRY,
  maxDimension = 1800,
) {
  const crop = getCropRect(sourceWidth, sourceHeight, geometry.aspectRatio);
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

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate((geometry.rotation * Math.PI) / 180);
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
  context.putImageData(processImageData(data, adjustments), 0, 0);
  applyVignette(context, width, height, adjustments.vignette);
  return { width, height, crop };
}
