import test from "node:test";
import assert from "node:assert/strict";
import { resolveSyncDecision } from "../src/lib/cloud/project-sync";

const baseline = "2026-08-04T09:00:00.000Z";

test("first sync reports conflict when both copies already differ", () => {
  assert.equal(
    resolveSyncDecision(
      "2026-08-04T10:00:00.000Z",
      "2026-08-04T11:00:00.000Z",
    ),
    "conflict",
  );
});

test("local-only modification resolves to push", () => {
  assert.equal(
    resolveSyncDecision(
      "2026-08-04T10:00:00.000Z",
      "2026-08-04T09:00:00.000Z",
      baseline,
    ),
    "push",
  );
});

test("cloud-only modification resolves to pull", () => {
  assert.equal(
    resolveSyncDecision(
      "2026-08-04T09:00:00.000Z",
      "2026-08-04T10:00:00.000Z",
      baseline,
    ),
    "pull",
  );
});

test("unchanged copies resolve to equal", () => {
  assert.equal(
    resolveSyncDecision(
      "2026-08-04T09:00:00.500Z",
      "2026-08-04T09:00:00.750Z",
      baseline,
    ),
    "equal",
  );
});

test("two modified copies stop as conflict", () => {
  assert.equal(
    resolveSyncDecision(
      "2026-08-04T10:00:00.000Z",
      "2026-08-04T10:30:00.000Z",
      baseline,
    ),
    "conflict",
  );
});
