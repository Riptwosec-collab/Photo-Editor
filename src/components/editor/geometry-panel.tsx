"use client";

import { FlipHorizontal2, FlipVertical2, RotateCw, RotateCcw } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { AspectRatio } from "@/features/editor/types";

const ratios: Array<{ value: AspectRatio; label: string }> = [
  { value: "original", label: "Original" },
  { value: "free", label: "Free" },
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "16:9", label: "16:9" },
];

export function GeometryPanel({ embedded = false }: { embedded?: boolean }) {
  const geometry = useEditorStore((state) => state.geometry);
  const rotateClockwise = useEditorStore((state) => state.rotateClockwise);
  const toggleFlipX = useEditorStore((state) => state.toggleFlipX);
  const toggleFlipY = useEditorStore((state) => state.toggleFlipY);
  const setAspectRatio = useEditorStore((state) => state.setAspectRatio);
  const setStraighten = useEditorStore((state) => state.setStraighten);
  const setCrop = useEditorStore((state) => state.setCrop);
  const setPerspective = useEditorStore((state) => state.setPerspective);
  const resetGeometry = useEditorStore((state) => state.resetGeometry);

  return (
    <div className={embedded ? "inline-editor-panel geometry-inline" : "panel-scroll"}>
      {!embedded && (
        <div className="panel-title">
          <div><span className="kicker">Non-destructive</span><h2>Crop & geometry</h2></div>
          <button className="icon-button" title="Reset geometry" onClick={resetGeometry}><RotateCcw size={16} /></button>
        </div>
      )}
      {embedded && <div className="inline-panel-actions"><span>Non-destructive transform</span><button className="mini-reset" title="Reset geometry" onClick={resetGeometry}><RotateCcw size={12} /></button></div>}

      <div className="ratio-grid compact">
        {ratios.map((ratio) => (
          <button
            key={ratio.value}
            className={geometry.aspectRatio === ratio.value ? "button active" : "button"}
            onClick={() => setAspectRatio(ratio.value)}
          >
            {ratio.label}
          </button>
        ))}
      </div>

      {geometry.aspectRatio === "free" && (
        <div className="free-crop-grid">
          {([
            ["cropX", "Left", geometry.cropX],
            ["cropY", "Top", geometry.cropY],
            ["cropWidth", "Width", geometry.cropWidth],
            ["cropHeight", "Height", geometry.cropHeight],
          ] as const).map(([key, label, value]) => (
            <label key={key}><span>{label}</span><output>{Math.round(value * 100)}%</output><input type="range" min="0" max="1" step="0.01" value={value} onChange={(event) => setCrop({ [key]: Number(event.target.value) })} /></label>
          ))}
        </div>
      )}

      <label className="compact-slider-label"><span>Straighten</span><output>{geometry.straighten.toFixed(1)}°</output><input type="range" min="-45" max="45" step="0.1" value={geometry.straighten} onChange={(event) => setStraighten(Number(event.target.value))} /></label>
      <label className="compact-slider-label"><span>Horizontal perspective</span><output>{geometry.perspectiveX}</output><input type="range" min="-100" max="100" value={geometry.perspectiveX} onChange={(event) => setPerspective(Number(event.target.value), geometry.perspectiveY)} /></label>
      <label className="compact-slider-label"><span>Vertical perspective</span><output>{geometry.perspectiveY}</output><input type="range" min="-100" max="100" value={geometry.perspectiveY} onChange={(event) => setPerspective(geometry.perspectiveX, Number(event.target.value))} /></label>

      <div className="geometry-actions compact">
        <button className="button" onClick={rotateClockwise}><RotateCw size={15} /> Rotate 90°</button>
        <button className={geometry.flipX ? "button active" : "button"} onClick={toggleFlipX}><FlipHorizontal2 size={15} /> Horizontal</button>
        <button className={geometry.flipY ? "button active" : "button"} onClick={toggleFlipY}><FlipVertical2 size={15} /> Vertical</button>
      </div>
      <p className="control-note">Perspective uses a reversible canvas shear approximation. RAW-profile geometry remains a future native pipeline.</p>
    </div>
  );
}
