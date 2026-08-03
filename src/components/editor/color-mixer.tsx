"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { AdjustmentKey } from "@/features/editor/types";

const colors = ["red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta"] as const;
type MixerColor = (typeof colors)[number];
const labels: Record<MixerColor, string> = { red: "Red", orange: "Orange", yellow: "Yellow", green: "Green", aqua: "Aqua", blue: "Blue", purple: "Purple", magenta: "Magenta" };
const properties = ["Hue", "Saturation", "Luminance"] as const;
function keyFor(color: MixerColor, property: (typeof properties)[number]) { return `${color}${property}` as AdjustmentKey; }

export function ColorMixer() {
  const [active, setActive] = useState<MixerColor>("orange");
  const adjustments = useEditorStore((state) => state.adjustments);
  const preview = useEditorStore((state) => state.previewAdjustment);
  const commit = useEditorStore((state) => state.commitAdjustments);
  function resetActive() { for (const property of properties) preview(keyFor(active, property), 0); commit(); }
  return (
    <section className="control-group color-mixer">
      <div className="subsection-heading"><h3>HSL Color Mixer</h3><button className="icon-button" title="Reset selected color" onClick={resetActive}><RotateCcw size={14} /></button></div>
      <div className="color-selector">{colors.map((color) => <button key={color} className={active === color ? `color-dot ${color} active` : `color-dot ${color}`} title={labels[color]} aria-label={`Select ${labels[color]}`} onClick={() => setActive(color)} />)}</div>
      <strong className="selected-color">{labels[active]}</strong>
      {properties.map((property) => { const key = keyFor(active, property); return <label className="slider-row" key={property}><span><b>{property}</b><output>{adjustments[key] > 0 ? "+" : ""}{adjustments[key]}</output></span><input type="range" min="-100" max="100" value={adjustments[key]} aria-label={`${labels[active]} ${property}`} onChange={(event) => preview(key, Number(event.target.value))} onPointerUp={commit} onKeyUp={commit} /></label>; })}
      <p className="control-note">Adjustments use overlapping hue ranges to reduce hard color boundaries.</p>
    </section>
  );
}
