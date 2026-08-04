"use client";

import { useRef } from "react";
import { RotateCcw, Save, Sparkles } from "lucide-react";
import { AUTO_ENHANCE_RECIPES, scaleRecipe } from "@/features/editor/intelligence";
import { useEditorStore } from "@/features/editor/store";
import type { Adjustments, AdjustmentKey } from "@/features/editor/types";
import {
  useStudioStore,
  type AutoEnhanceMode,
  type LockTarget,
  type SelectiveTarget,
} from "@/features/studio/store";
import { saveUserPreset } from "@/lib/idb";
import { Toggle } from "@/components/ui/editor-controls";

const modes: Array<{ value: AutoEnhanceMode; label: string }> = [
  { value: "balanced", label: "Balanced" },
  { value: "natural", label: "Natural" },
  { value: "portrait", label: "Portrait" },
  { value: "night", label: "Night" },
  { value: "vivid", label: "Vivid" },
  { value: "cinematic", label: "Cinematic" },
  { value: "professional", label: "Professional" },
  { value: "social", label: "Social" },
  { value: "print", label: "Print" },
];

const selectiveLabels: Array<[SelectiveTarget, string]> = [
  ["subject", "Subject"], ["face", "Face"], ["skin", "Skin"], ["eyes", "Eyes"], ["hair", "Hair"],
  ["clothing", "Clothing"], ["background", "Background"], ["colors", "Colors"], ["exposure", "Exposure"], ["crop", "Crop"],
];
const lockLabels: Array<[LockTarget, string]> = [
  ["identity", "Lock identity"], ["skinTone", "Lock skin tone"], ["background", "Lock background"],
  ["face", "Lock face"], ["colors", "Lock colors"], ["crop", "Lock crop"],
];

export function AutoEnhanceSection({ onNotice }: { onNotice: (message: string) => void }) {
  const image = useEditorStore((state) => state.image);
  const adjustments = useEditorStore((state) => state.adjustments);
  const apply = useEditorStore((state) => state.applyAdjustments);
  const preview = useEditorStore((state) => state.previewAdjustment);
  const commit = useEditorStore((state) => state.commitAdjustments);
  const resetSection = useEditorStore((state) => state.resetSection);
  const mode = useStudioStore((state) => state.autoMode);
  const intensity = useStudioStore((state) => state.autoIntensity);
  const selective = useStudioStore((state) => state.selective);
  const locks = useStudioStore((state) => state.locks);
  const setMode = useStudioStore((state) => state.setAutoMode);
  const setIntensity = useStudioStore((state) => state.setAutoIntensity);
  const toggleSelective = useStudioStore((state) => state.toggleSelective);
  const toggleLock = useStudioStore((state) => state.toggleLock);
  const previewSnapshot = useRef<Adjustments | null>(null);

  function filteredRecipe(targetMode: AutoEnhanceMode) {
    const recipe = { ...AUTO_ENHANCE_RECIPES[targetMode] };
    const remove = (...keys: AdjustmentKey[]) => keys.forEach((key) => delete recipe[key]);
    if (!selective.exposure) remove("exposure", "contrast", "highlights", "shadows", "whites", "blacks", "shadowRecovery", "highlightRecovery");
    if (!selective.colors || locks.colors) remove("temperature", "tint", "vibrance", "saturation", "shadowSaturation", "highlightSaturation");
    if ((!selective.skin && !selective.face) || locks.skinTone) remove("temperature", "tint", "orangeHue", "orangeSaturation", "orangeLuminance");
    if (!selective.background || locks.background) remove("dehaze", "vignette");
    if (locks.identity || locks.face) remove("texture", "clarity");
    return scaleRecipe(adjustments, recipe, intensity);
  }

  function beginPreview(targetMode: AutoEnhanceMode) {
    if (!image || previewSnapshot.current) return;
    previewSnapshot.current = { ...adjustments };
    const recipe = filteredRecipe(targetMode);
    for (const [key, value] of Object.entries(recipe)) preview(key as AdjustmentKey, Number(value));
  }

  function endPreview() {
    if (!previewSnapshot.current) return;
    for (const [key, value] of Object.entries(previewSnapshot.current)) preview(key as AdjustmentKey, value);
    previewSnapshot.current = null;
  }

  function applyMode(targetMode = mode) {
    endPreview();
    setMode(targetMode);
    apply(filteredRecipe(targetMode));
    onNotice(`${targetMode} auto enhance applied`);
  }

  async function saveAsPreset() {
    const now = new Date().toISOString();
    await saveUserPreset({
      id: crypto.randomUUID(),
      name: `${mode[0].toUpperCase() + mode.slice(1)} Auto ${intensity}`,
      description: "Saved from AI Auto Enhance settings",
      createdAt: now,
      updatedAt: now,
      adjustments: filteredRecipe(mode),
      scope: "full",
    });
    onNotice("Auto Enhance recipe saved as a personal preset");
  }

  const changedKeys = Array.from(
    new Set(Object.values(AUTO_ENHANCE_RECIPES).flatMap((recipe) => Object.keys(recipe))),
  ) as AdjustmentKey[];

  return (
    <div className="auto-enhance-system">
      <div className="mode-grid">
        {modes.map((option) => (
          <button
            type="button"
            key={option.value}
            className={mode === option.value ? "active" : ""}
            onMouseEnter={() => beginPreview(option.value)}
            onMouseLeave={endPreview}
            onFocus={() => beginPreview(option.value)}
            onBlur={endPreview}
            onClick={() => applyMode(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="compact-slider-label"><span>Intensity</span><output>{intensity}%</output><input type="range" min="0" max="100" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label>
      <div className="exact-change-summary"><strong>Exact settings</strong><span>{Object.entries(filteredRecipe(mode)).slice(0, 6).map(([key, value]) => `${key} ${Number(value).toFixed(1)}`).join(" · ")}</span></div>
      <div className="auto-actions"><button className="button primary" disabled={!image} onClick={() => applyMode()}><Sparkles size={15} /> Apply mode</button><button className="button" onClick={() => void saveAsPreset()} disabled={!image}><Save size={15} /> Save preset</button><button className="icon-button" title="Reset Auto Enhance settings" onClick={() => resetSection(changedKeys)}><RotateCcw size={14} /></button></div>

      <div className="selective-enhance-grid">
        <div><strong>Selective Enhance</strong>{selectiveLabels.map(([target, label]) => <Toggle key={target} label={label} checked={selective[target]} onChange={() => toggleSelective(target)} />)}</div>
        <div><strong>Protection Locks</strong>{lockLabels.map(([target, label]) => <Toggle key={target} label={label} checked={locks[target]} onChange={() => toggleLock(target)} />)}</div>
      </div>
    </div>
  );
}
