export type AdjustmentKey = keyof Adjustments;

export type Adjustments = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  clarity: number;
  sharpness: number;
  noiseReduction: number;
  vignette: number;
  grain: number;
};

export type AspectRatio = "original" | "1:1" | "4:5" | "16:9";

export type Geometry = {
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  aspectRatio: AspectRatio;
};

export type EditorSnapshot = {
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
};

export type AiEditPlan = {
  provider: "local-rule-based-demo";
  summary: string;
  detected: string[];
  changes: Array<{ key: AdjustmentKey; value: number; reason: string }>;
  warnings: string[];
};

export type StoredProject = {
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
};
