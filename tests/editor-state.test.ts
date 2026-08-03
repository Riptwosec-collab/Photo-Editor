import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY, PRESETS } from "../src/features/editor/defaults";
import { createLocalEditPlan } from "../src/features/ai/local-provider";
import { applyDetailFilters, getCropRect } from "../src/features/editor/image-processing";

test("default adjustment recipe is neutral", () => {
  for (const value of Object.values(DEFAULT_ADJUSTMENTS)) assert.equal(value, 0);
  assert.deepEqual(DEFAULT_GEOMETRY, {
    rotation: 0,
    flipX: false,
    flipY: false,
    aspectRatio: "original",
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

test("center crop preserves requested aspect ratio", () => {
  const square = getCropRect(1600, 900, "1:1");
  assert.equal(Math.round(square.sw), 900);
  assert.equal(Math.round(square.sh), 900);
  assert.equal(Math.round(square.sx), 350);

  const portrait = getCropRect(1200, 1800, "4:5");
  assert.equal(Math.round((portrait.sw / portrait.sh) * 100), 80);
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
  const result = applyDetailFilters(fakeImageData, width, height, 0, 100);
  assert.ok(result.data[center] < 240);
  assert.equal(result.data[center + 3], 255);
});
