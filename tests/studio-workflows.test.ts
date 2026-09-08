import test from "node:test";
import assert from "node:assert/strict";
import { signJob, verifyJob } from "../src/features/ai/job-security";
import { imageData, layersSchema } from "../src/features/projects/backup";
import { createLayer } from "../src/features/render/layers";
import { decideRevision } from "../src/lib/cloud/project-sync";
import { useEditorStore } from "../src/features/editor/store";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "../src/features/editor/defaults";

test("AI receipt binds owner, job, secret and expiry", () => {
  const receipt = signJob("job_123", "owner-a", "server-only-secret", 1000);
  assert.equal(verifyJob(receipt, "owner-a", "server-only-secret", 2000), "job_123");
  assert.throws(() => verifyJob(receipt, "owner-b", "server-only-secret", 2000));
  assert.throws(() => verifyJob(receipt, "owner-a", "different-secret", 2000));
  assert.throws(() => verifyJob(receipt, "owner-a", "server-only-secret", 1000 + 86400000));
  assert.throws(() => verifyJob(receipt + ".ignored", "owner-a", "server-only-secret", 2000));
  const [body, signature] = receipt.split(".");
  const claim = JSON.parse(Buffer.from(body, "base64url").toString());
  claim.id = "other_job";
  assert.throws(() => verifyJob(Buffer.from(JSON.stringify(claim)).toString("base64url") + "." + signature, "owner-a", "server-only-secret", 2000));
});

test("revision sync detects changes without relying on device clocks", () => {
  const baseline = { local: "hash-a", cloud: 12 };
  assert.equal(decideRevision("hash-a", 12, baseline), "equal");
  assert.equal(decideRevision("hash-b", 12, baseline), "push");
  assert.equal(decideRevision("hash-a", 13, baseline), "pull");
  assert.equal(decideRevision("hash-b", 13, baseline), "conflict");
  assert.equal(decideRevision("hash-a", 12), "conflict");
});

test("project backup accepts image data and rejects external or executable sources", () => {
  assert.equal(imageData.safeParse("data:image/png;base64,aGVsbG8=").success, true);
  for (const unsafe of ["https://example.com/image.png", "javascript:alert(1)", "data:image/svg+xml;base64,PHN2Zz4="]) {
    assert.equal(imageData.safeParse(unsafe).success, false);
  }
  const layer = createLayer();
  assert.equal(layersSchema.safeParse([layer]).success, true);
  assert.equal(layersSchema.safeParse([{ ...layer, opacity: 5 }]).success, false);
  assert.equal(layersSchema.safeParse([{ ...layer, mask: { ...layer.mask, strokes: [{ points: [{ x: 2, y: .5 }], radius: .1 }] } }]).success, false);
  assert.equal(layersSchema.safeParse(Array.from({ length: 21 }, () => layer)).success, false);
});

test("layer edits and named snapshots preserve masks across undo and redo", () => {
  const s = useEditorStore.getState();
  s.loadRecipe(DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY, []);
  const layer = createLayer();
  layer.mask = { ...layer.mask, kind: "brush", strokes: [{ radius: .05, points: [{ x: .2, y: .3 }] }] };
  s.addLayer(layer);
  const original = structuredClone(useEditorStore.getState().committed);
  s.updateLayer(layer.id, { opacity: .4 });
  s.undo();
  assert.equal(useEditorStore.getState().layers[0].opacity, 1);
  assert.deepEqual(useEditorStore.getState().layers[0].mask, layer.mask);
  s.redo();
  assert.equal(useEditorStore.getState().layers[0].opacity, .4);
  s.restoreSnapshot(original);
  original.layers![0].mask.strokes[0].points[0].x = .9;
  assert.equal(useEditorStore.getState().layers[0].mask.strokes[0].points[0].x, .2);
  s.undo();
  assert.equal(useEditorStore.getState().layers[0].opacity, .4);
  s.removeLayer(layer.id);
  assert.equal(useEditorStore.getState().layers.length, 0);
  s.undo();
  assert.equal(useEditorStore.getState().layers.length, 1);
  s.loadRecipe(DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY, []);
});
