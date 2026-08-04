"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { AdjustmentKey } from "@/features/editor/types";

const points: Array<{ key: AdjustmentKey; x: number; base: number; label: string }> = [
  { key: "curveShadows", x: 64, base: 64, label: "Shadows" },
  { key: "curveMidtones", x: 128, base: 128, label: "Midtones" },
  { key: "curveHighlights", x: 192, base: 192, label: "Highlights" },
];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function ToneCurvePanel({ embedded = false }: { embedded?: boolean }) {
  const adjustments = useEditorStore((state) => state.adjustments);
  const preview = useEditorStore((state) => state.previewAdjustment);
  const commit = useEditorStore((state) => state.commitAdjustments);
  const resetSection = useEditorStore((state) => state.resetSection);
  const active = useRef<AdjustmentKey | null>(null);

  const curvePoints = [
    [0, 255],
    ...points.map((point) => [point.x, 255 - clamp(point.base + adjustments[point.key], 0, 255)]),
    [255, 0],
  ];
  const path = curvePoints.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");

  function updateFromPointer(event: React.PointerEvent<SVGSVGElement>) {
    if (!active.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const y = clamp(((event.clientY - rect.top) / rect.height) * 255, 0, 255);
    const definition = points.find((point) => point.key === active.current);
    if (!definition) return;
    preview(definition.key, Math.round(clamp(255 - y - definition.base, -64, 64)));
  }

  function resetCurve() {
    resetSection(points.map((point) => point.key));
  }

  return (
    <div className={embedded ? "inline-editor-panel tone-curve-inline" : "panel-scroll"}>
      {!embedded && (
        <div className="panel-title">
          <div><span className="kicker">RGB composite</span><h2>Tone Curve</h2></div>
          <button className="icon-button" title="Reset curve" onClick={resetCurve}><RotateCcw size={16} /></button>
        </div>
      )}
      {embedded && <div className="inline-panel-actions"><span>RGB composite</span><button className="mini-reset" title="Reset curve" onClick={resetCurve}><RotateCcw size={12} /></button></div>}
      <section className="curve-card">
        <svg
          viewBox="0 0 255 255"
          role="img"
          aria-label="Editable composite tone curve"
          onPointerMove={updateFromPointer}
          onPointerUp={(event) => {
            active.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            commit();
          }}
          onPointerCancel={() => {
            active.current = null;
            commit();
          }}
        >
          {[64, 128, 192].map((line) => <path key={`v-${line}`} d={`M${line},0 V255`} className="curve-grid-line" />)}
          {[64, 128, 192].map((line) => <path key={`h-${line}`} d={`M0,${line} H255`} className="curve-grid-line" />)}
          <path d="M0,255 L255,0" className="curve-reference" />
          <path d={path} className="curve-line" />
          {points.map((point) => {
            const y = 255 - clamp(point.base + adjustments[point.key], 0, 255);
            return (
              <circle
                key={point.key}
                cx={point.x}
                cy={y}
                r="8"
                className="curve-point"
                onPointerDown={(event) => {
                  active.current = point.key;
                  event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
                }}
              />
            );
          })}
        </svg>
      </section>
      <section className="curve-sliders">
        {points.map((point) => (
          <label className="slider-row" key={point.key}>
            <span><b>{point.label}</b><output>{adjustments[point.key] > 0 ? "+" : ""}{adjustments[point.key]}</output></span>
            <input aria-label={`${point.label} curve`} type="range" min="-64" max="64" value={adjustments[point.key]} onChange={(event) => preview(point.key, Number(event.target.value))} onPointerUp={commit} onKeyUp={commit} />
          </label>
        ))}
      </section>
      <p className="control-note">Drag the three points vertically. Endpoints remain locked to protect black and white clipping.</p>
    </div>
  );
}
