import test from "node:test";
import assert from "node:assert/strict";
import { analyzePixels } from "../src/features/ai/pixel-analysis";
test("dark and bright images produce bounded opposite exposure corrections", () => {
  const dark = analyzePixels([10, 10, 10, 255]);
  const bright = analyzePixels([250, 250, 250, 255]);
  assert.ok(dark.changes.exposure! > 0 && dark.changes.exposure! <= .65);
  assert.ok(bright.changes.exposure! < 0 && bright.changes.exposure! >= -.65);
  assert.equal(dark.shadows, 100);
  assert.equal(bright.highlights, 100);
  assert.ok(bright.changes.highlights! < 0);
});
test("transparent pixels do not bias measurement", () => {
  const result = analyzePixels([0, 0, 0, 0, 118, 118, 118, 255]);
  assert.equal(result.samples, 1);
  assert.ok(Math.abs(result.changes.exposure!) < .01);
  assert.throws(() => analyzePixels([0, 0, 0, 0]), /No visible pixels/);
});
