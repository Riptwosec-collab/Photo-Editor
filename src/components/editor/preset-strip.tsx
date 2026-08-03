"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PRESETS } from "@/features/editor/defaults";
import { useEditorStore } from "@/features/editor/store";
import type { UserPreset } from "@/features/editor/types";
import { listUserPresets, saveUserPreset } from "@/lib/idb";

export function PresetStrip() {
  const apply = useEditorStore((state) => state.applyAdjustments);
  const adjustments = useEditorStore((state) => state.adjustments);
  const active = useEditorStore((state) => state.activePreset);
  const [custom, setCustom] = useState<UserPreset[]>([]);
  const [status, setStatus] = useState("");

  const refresh = useCallback(async () => {
    try { setCustom(await listUserPresets()); setStatus(""); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Unable to load presets"); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function saveCurrent() {
    const name = window.prompt("Preset name", `My Look ${custom.length + 1}`)?.trim();
    if (!name) return;
    const now = new Date().toISOString();
    try {
      await saveUserPreset({ id:crypto.randomUUID(), name, description:"Saved from the current full adjustment recipe", createdAt:now, updatedAt:now, adjustments:{...adjustments}, scope:"full" });
      await refresh();
      setStatus("Preset saved");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Preset save failed"); }
  }

  return (
    <div className="preset-strip" aria-label="Preset library">
      {PRESETS.map((preset) => <button className={active === preset.id ? "preset active" : "preset"} key={preset.id} title={preset.description} onClick={() => apply(preset.adjustments, preset.id)}><span className={`preset-swatch ${preset.id}`} /><b>{preset.name}</b><small>{preset.description}</small></button>)}
      {custom.map((preset) => <button className={active === preset.id ? "preset active" : "preset"} key={preset.id} title={preset.description} onClick={() => apply(preset.adjustments, preset.id)}><span className="preset-swatch custom" /><b>{preset.name}</b><small>{preset.scope} preset</small></button>)}
      <button className="preset save-preset" onClick={() => void saveCurrent()}><span className="preset-add"><Plus size={16} /></span><b>Save current</b><small>{status || "Create reusable preset"}</small></button>
    </div>
  );
}
