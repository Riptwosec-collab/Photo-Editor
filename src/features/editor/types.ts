import type { CubeLut, ChannelCurves } from "./color-tools";
export type AdjustmentKey = keyof Adjustments;

export type Adjustments = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  brightness: number;
  gamma: number;
  dynamicRange: number;
  midtoneContrast: number;
  highlightRecovery: number;
  shadowRecovery: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  texture: number;
  clarity: number;
  dehaze: number;
  sharpness: number;
  noiseReduction: number;
  vignette: number;
  grain: number;
  curveShadows: number;
  curveMidtones: number;
  curveHighlights: number;
  shadowHue: number;
  shadowSaturation: number;
  midtoneHue: number;
  midtoneSaturation: number;
  highlightHue: number;
  highlightSaturation: number;
  gradingBalance: number;
  redHue: number;
  redSaturation: number;
  redLuminance: number;
  orangeHue: number;
  orangeSaturation: number;
  orangeLuminance: number;
  yellowHue: number;
  yellowSaturation: number;
  yellowLuminance: number;
  greenHue: number;
  greenSaturation: number;
  greenLuminance: number;
  aquaHue: number;
  aquaSaturation: number;
  aquaLuminance: number;
  blueHue: number;
  blueSaturation: number;
  blueLuminance: number;
  purpleHue: number;
  purpleSaturation: number;
  purpleLuminance: number;
  magentaHue: number;
  magentaSaturation: number;
  magentaLuminance: number;
};

export type AspectRatio = "original" | "free" | "1:1" | "4:5" | "16:9" | "9:16";

export type Geometry = {
  perspectiveMode?: "shear" | "projective";
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  aspectRatio: AspectRatio;
  straighten: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  perspectiveX: number;
  perspectiveY: number;
};

export type MaskStroke = { points: Array<{ x: number; y: number }>; radius: number; erase?: boolean };
export type LayerMask = { kind: "all" | "radial" | "linear" | "brush" | "image"; edgeShift?: number; edgeContrast?: number; dataUrl?: string; x: number; y: number; radius: number; feather: number; invert: boolean; strokes: MaskStroke[] };
export type EditorLayer = {
  id: string; name: string; kind: "adjustment" | "text" | "raster"; visible: boolean; opacity: number;
  adjustments: Partial<Adjustments>; mask: LayerMask;
  transform?: { x: number; y: number; scale: number; rotation: number };
  locked?: boolean; group?: string; textAlign?: "left" | "center" | "right";
  replaceBase?: boolean; retouchMode?: "clone" | "heal"; decontaminate?: number;
  colorReplace?: { color: string; strength: number };
  lut?: CubeLut; channelCurves?: ChannelCurves; retouch?: { x: number; y: number; radius: number; sourceX: number; sourceY: number; mode?: "clone" | "heal" }[];
  text?: string; color?: string; fontSize?: number; x?: number; y?: number; dataUrl?: string;
};

export type EditorSnapshot = {
  layers?: EditorLayer[];
  adjustments: Adjustments;
  geometry: Geometry;
};

export type EditorPreset = {
  id: string;
  name: string;
  description: string;
  adjustments: Partial<Adjustments>;
};

export type ImportedImage = {
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  objectUrl: string;
  iso?: number;
  aperture?: string;
  focalLength?: string;
  shutterSpeed?: string;
  camera?: string;
  rawType?: string;
};

export type AiEditPlan = {
  provider: "local-rule-based-demo";
  summary: string;
  detected: string[];
  changes: Array<{ key: AdjustmentKey; value: number; reason: string }>;
  warnings: string[];
};

export type StoredProject = {
  layers?: EditorLayer[];
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  imageBlob: Blob;
  imageName: string;
  imageType: string;
  width: number;
  height: number;
  adjustments: Adjustments;
  geometry: Geometry;
  archivedAt?: string;
  trashedAt?: string; album?: string; tags?: string[];
};

export type StoredVersion = {
  layers?: EditorLayer[];
  parentVersionId?: string;
  thumbnail?: string;
  id: string;
  projectId: string;
  name: string;
  note?: string;
  createdAt: string;
  adjustments: Adjustments;
  geometry: Geometry;
};

export type ExportFormat = "image/jpeg" | "image/png" | "image/webp";

export type ExportRecord = {
  id: string;
  projectId: string;
  createdAt: string;
  format: ExportFormat;
  quality: number;
  longEdge: number;
  width: number;
  height: number;
  filename: string;
  colorSpace: "sRGB" | "Display P3";
};

export type UserPreset = {
  favorite?: boolean;
  folder?: string;
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  adjustments: Partial<Adjustments>;
  scope: "full" | "light" | "color";
};
