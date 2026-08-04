import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY, PRESETS } from "../src/features/editor/defaults";
import { createLocalEditPlan } from "../src/features/ai/local-provider";
import {
  applyColorMixer,
  applyDetailFilters,
  createToneCurveLut,
  getCropRect,
  processImageData,
} from "../src/features/editor/image-processing";
import { deriveColorMatch, scaleRecipe } from "../src/features/editor/intelligence";

test("default adjustment recipe is neutral", () => {
  for (const value of Object.values(DEFAULT_ADJUSTMENTS)) assert.equal(value, 0);
  assert.deepEqual(DEFAULT_GEOMETRY, {
    rotation: 0,
    flipX: false,
    flipY: false,
    aspectRatio: "original",
    straighten: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 1,
    cropHeight: 1,
    perspectiveX: 0,
    perspectiveY: 0,
  });
});

test("every preset uses known adjustment keys", () => {
  const allowed = new Set(Object.keys(DEFAULT_ADJUSTMENTS));
  for (const preset of PRESETS) {
    for (const key of Object.keys(preset.adjustments)) assert.ok(allowed.has(key));
  }
});

test("local AI plan is explicitly labeled demo", () => {
  const plan = createLocalEditPlan("Make it cinematic");
  assert.equal(plan.provider, "local-rule-based-demo");
  assert.ok(plan.warnings.some((warning) => warning.includes("DEMO")));
  assert.ok(plan.changes.some((change) => change.key === "contrast"));
});

test("fixed and free crop preserve requested bounds", () => {
  const square = getCropRect(1600, 900, "1:1");
  assert.equal(Math.round(square.sw), 900);
  assert.equal(Math.round(square.sh), 900);
  assert.equal(Math.round(square.sx), 350);
  const portrait = getCropRect(1200, 1800, "4:5");
  assert.equal(Math.round((portrait.sw / portrait.sh) * 100), 80);
  const free = getCropRect(2000, 1000, "free", {
    cropX: 0.1,
    cropY: 0.2,
    cropWidth: 0.5,
    cropHeight: 0.6,
  });
  assert.deepEqual(free, { sx: 200, sy: 200, sw: 1000, sh: 600 });
});

test("detail filters alter noisy center pixels without changing alpha", () => {
  const width = 3;
  const height = 3;
  const pixels = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = 100;
    pixels[index + 1] = 100;
    pixels[index + 2] = 100;
  }
  const center = (1 * width + 1) * 4;
  pixels[center] = 240;
  pixels[center + 1] = 240;
  pixels[center + 2] = 240;
  const fakeImageData = { data: pixels, width, height, colorSpace: "srgb" } as ImageData;
  const result = applyDetailFilters(fakeImageData, width, height, 0, 100, 0);
  assert.ok(result.data[center] < 240);
  assert.equal(result.data[center + 3], 255);
});

test("neutral tone curve produces an identity LUT", () => {
  const lut = createToneCurveLut(DEFAULT_ADJUSTMENTS);
  for (let value = 0; value < 256; value += 1) assert.equal(lut[value], value);
});

test("neutral HSL mixer preserves representative colors", () => {
  for (const sample of [[255, 80, 40], [40, 180, 90], [50, 90, 240]]) {
    const result = applyColorMixer(sample[0], sample[1], sample[2], DEFAULT_ADJUSTMENTS);
    assert.ok(Math.abs(result.r - sample[0]) < 1);
    assert.ok(Math.abs(result.g - sample[1]) < 1);
    assert.ok(Math.abs(result.b - sample[2]) < 1);
  }
});

test("advanced tonal parameters alter pixels while preserving alpha", () => {
  const pixels = new Uint8ClampedArray([80, 100, 120, 255]);
  const imageData = { data: pixels, width: 1, height: 1, colorSpace: "srgb" } as ImageData;
  const result = processImageData(imageData, {
    ...DEFAULT_ADJUSTMENTS,
    brightness: 10,
    gamma: 12,
    dynamicRange: 18,
    shadowRecovery: 16,
    dehaze: 8,
  });
  assert.notDeepEqual(Array.from(result.data.slice(0, 3)), [80, 100, 120]);
  assert.equal(result.data[3], 255);
});

test("reference color matching creates bounded exposure and white balance changes", () => {
  const recipe = deriveColorMatch(
    { r: 70, g: 80, b: 110, luminance: 80 },
    { r: 150, g: 120, b: 90, luminance: 125 },
    75,
  );
  assert.ok(Number(recipe.exposure) > 0);
  assert.ok(Number(recipe.temperature) > 0);
  assert.ok(Math.abs(Number(recipe.tint)) <= 30);
});

test("recipe scaling approaches target at full intensity", () => {
  const result = scaleRecipe(DEFAULT_ADJUSTMENTS, { exposure: 1, contrast: 20 }, 100);
  assert.equal(result.exposure, 1);
  assert.equal(result.contrast, 20);
});
