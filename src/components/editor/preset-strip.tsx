"use client";
import { PRESETS } from "@/features/editor/defaults";
import { useEditorStore } from "@/features/editor/store";
export function PresetStrip(){const apply=useEditorStore(s=>s.applyAdjustments);const active=useEditorStore(s=>s.activePreset);return <div className="preset-strip" aria-label="Preset library">{PRESETS.map(p=><button className={active===p.id?"preset active":"preset"} key={p.id} title={p.description} onClick={()=>apply(p.adjustments,p.id)}><span className={`preset-swatch ${p.id}`}/><b>{p.name}</b><small>{p.description}</small></button>)}</div>}
