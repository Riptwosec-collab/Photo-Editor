"use client";
import { T } from "@/features/i18n/text";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Star } from "lucide-react";
import { PRESETS } from "@/features/editor/defaults";
import { useEditorStore } from "@/features/editor/store";
import type { UserPreset, Adjustments, EditorPreset } from "@/features/editor/types";
import { listUserPresets, saveUserPreset } from "@/lib/idb";
import { RecipeThumbnail } from "./recipe-thumbnail";
import { usePreferences } from "@/features/studio/preferences";
export function PresetStrip() {
  const apply = useEditorStore((s) => s.applyAdjustments);
  const image = useEditorStore((s) => s.image);
  const adjustments = useEditorStore((s) => s.adjustments);
  const committed = useEditorStore((s) => s.committed);
  const active = useEditorStore((s) => s.activePreset);
  const toggleOriginal = useEditorStore((s) => s.toggleOriginal);
  const [custom, setCustom] = useState<UserPreset[]>([]);
  const [status, setStatus] = useState("");
  const [intensity, setIntensity] = useState(100);
  const [folder, setFolder] = useState("all");
  const [selected, setSelected] = useState<EditorPreset | UserPreset | null>(null);
  const baseline = useRef<Adjustments | null>(null);
  const favorites = usePreferences((s) => s.favoritePresets);
  const toggleFavorite = usePreferences((s) => s.toggleFavoritePreset);
  const refresh = useCallback(async () => { try { setCustom(await listUserPresets()); } catch { setStatus("Unable to load presets"); } }, []);
  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [refresh]);
  function choose(preset: EditorPreset | UserPreset) { baseline.current = { ...adjustments }; setSelected(preset); setIntensity(100); apply(preset.adjustments, preset.id); }
  function strength(value: number) {
    if (!baseline.current || !selected) return;
    setIntensity(value);
    const changes = Object.fromEntries(Object.entries(selected.adjustments).map(([key,target]) => [key, baseline.current![key as keyof Adjustments] + ((target ?? 0) - baseline.current![key as keyof Adjustments]) * value / 100]));
    // Preview slider changes as one history step on release.
    for (const [key, value] of Object.entries(changes)) useEditorStore.getState().previewAdjustment(key as keyof Adjustments, value);
  }
  async function saveCurrent() {
    const name = window.prompt("Preset name", `My Look ${custom.length + 1}`)?.trim(); if (!name) return;
    const now = new Date().toISOString();
    try { await saveUserPreset({ id: crypto.randomUUID(), name, description: "Personal look", createdAt: now, updatedAt: now, adjustments: { ...adjustments }, scope: "full", folder: "My looks" }); await refresh(); setStatus("Preset saved"); }
    catch { setStatus("Preset save failed"); }
  }
  const all = [...PRESETS, ...custom];
  const visible = all.filter((p) => folder === "all" || (folder === "favorites" ? favorites.includes(p.id) : ("folder" in p && p.folder === folder)));
  return <div className="preset-workbench"><div className="preset-controls"><select aria-label="Preset folder" value={folder} onChange={(e) => setFolder(e.target.value)}><option value="all">All looks</option><option value="favorites">Favorites</option>{[...new Set(custom.map((p) => p.folder).filter(Boolean))].map((f) => <option key={f}>{f}</option>)}</select><label> <T text={"Intensity"} /> <input aria-label="Preset intensity" type="range" min="0" max="100" value={intensity} disabled={!selected} onChange={(e) => strength(+e.target.value)} onPointerUp={() => useEditorStore.getState().commitAdjustments()} onKeyUp={() => useEditorStore.getState().commitAdjustments()} onBlur={() => useEditorStore.getState().commitAdjustments()} /><output>{intensity}%</output></label><button onPointerDown={() => toggleOriginal(true)} onPointerUp={() => toggleOriginal(false)} onPointerCancel={() => toggleOriginal(false)} onPointerLeave={() => toggleOriginal(false)} onBlur={() => toggleOriginal(false)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") toggleOriginal(true); }} onKeyUp={() => toggleOriginal(false)}> <T text={"Hold to compare"} /> </button></div><div className="preset-strip" aria-label="Preset library">{visible.map((preset) => <div className="preset-tile" key={preset.id}><button className={active === preset.id ? "preset active" : "preset"} title={preset.description} onClick={() => choose(preset)}><RecipeThumbnail url={image?.objectUrl} adjustments={{ ...committed.adjustments, ...preset.adjustments }} geometry={committed.geometry} layers={committed.layers} /><b>{preset.name}</b></button><button className="preset-favorite" aria-label={`Favorite ${preset.name}`} aria-pressed={favorites.includes(preset.id)} onClick={() => toggleFavorite(preset.id)}><Star size={12} fill={favorites.includes(preset.id) ? "currentColor" : "none"} /></button></div>)}<button className="preset save-preset" onClick={() => void saveCurrent()}><Plus size={16} /><b> <T text={"Save current"} /> </b><small>{status || "Create reusable preset"}</small></button></div></div>;
}
