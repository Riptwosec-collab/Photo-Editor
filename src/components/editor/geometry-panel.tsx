"use client";

import { FlipHorizontal2, FlipVertical2, RotateCw, RotateCcw } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { AspectRatio } from "@/features/editor/types";

const ratios: Array<{ value: AspectRatio; label: string }> = [
  { value: "original", label: "Original" },
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "16:9", label: "16:9" },
];

export function GeometryPanel() {
  const geometry = useEditorStore((state) => state.geometry);
  const rotateClockwise = useEditorStore((state) => state.rotateClockwise);
  const toggleFlipX = useEditorStore((state) => state.toggleFlipX);
  const toggleFlipY = useEditorStore((state) => state.toggleFlipY);
  const setAspectRatio = useEditorStore((state) => state.setAspectRatio);
  const resetGeometry = useEditorStore((state) => state.resetGeometry);

  return (
    <div className="panel-scroll">
      <div className="panel-title">
        <div>
          <span className="kicker">Non-destructive</span>
          <h2>Crop & geometry</h2>
        </div>
        <button className="icon-button" title="Reset geometry" onClick={resetGeometry}>
          <RotateCcw size={16} />
        </button>
      </div>

      <section className="control-group">
        <h3>Aspect ratio</h3>
        <div className="ratio-grid">
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
        <p className="control-note">The current MVP uses a reversible centered crop.</p>
      </section>

      <section className="control-group">
        <h3>Transform</h3>
        <div className="geometry-actions">
          <button className="button" onClick={rotateClockwise}>
            <RotateCw size={16} /> Rotate 90°
          </button>
          <button className={geometry.flipX ? "button active" : "button"} onClick={toggleFlipX}>
            <FlipHorizontal2 size={16} /> Flip horizontal
          </button>
          <button className={geometry.flipY ? "button active" : "button"} onClick={toggleFlipY}>
            <FlipVertical2 size={16} /> Flip vertical
          </button>
        </div>
        <dl className="geometry-summary">
          <div><dt>Rotation</dt><dd>{geometry.rotation}°</dd></div>
          <div><dt>Horizontal</dt><dd>{geometry.flipX ? "Flipped" : "Normal"}</dd></div>
          <div><dt>Vertical</dt><dd>{geometry.flipY ? "Flipped" : "Normal"}</dd></div>
        </dl>
      </section>
    </div>
  );
}
