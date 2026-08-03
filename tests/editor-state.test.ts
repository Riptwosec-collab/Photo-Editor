import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ADJUSTMENTS, PRESETS } from "../src/features/editor/defaults";
import { createLocalEditPlan } from "../src/features/ai/local-provider";

test("default adjustment recipe is neutral",()=>{for(const value of Object.values(DEFAULT_ADJUSTMENTS))assert.equal(value,0);});
test("every preset uses known adjustment keys",()=>{const allowed=new Set(Object.keys(DEFAULT_ADJUSTMENTS));for(const preset of PRESETS)for(const key of Object.keys(preset.adjustments))assert.ok(allowed.has(key));});
test("local AI plan is explicitly labeled demo",()=>{const plan=createLocalEditPlan("Make it cinematic");assert.equal(plan.provider,"local-rule-based-demo");assert.ok(plan.warnings.some(w=>w.includes("DEMO")));assert.ok(plan.changes.some(c=>c.key==="contrast"));});
