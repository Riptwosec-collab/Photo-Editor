"use client";

import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { renderToCanvas } from "@/features/editor/image-processing";
import { useEditorStore } from "@/features/editor/store";
import { useStudioStore } from "@/features/studio/store";

export function Histogram() {
  const outputRef = useRef<HTMLCanvasElement>(null);
  const image = useEditorStore((state) => state.image);
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);
  const clippingVisible = useStudioStore((state) => state.clippingVisible);
  const toggleCanvasFlag = useStudioStore((state) => state.toggleCanvasFlag);
  const [clipping, setClipping] = useState({ shadows: 0, highlights: 0 });

  useEffect(() => {
    if (!image || !outputRef.current) return;
    let cancelled = false;
    const source = new Image();
    source.onload = () => {
      if (cancelled || !outputRef.current) return;
      const sample = document.createElement("canvas");
      renderToCanvas(source, source.naturalWidth, source.naturalHeight, sample, adjustments, geometry, 320);
      const context = sample.getContext("2d", { willReadFrequently: true });
      const output = outputRef.current;
      const outputContext = output.getContext("2d");
      if (!context || !outputContext) return;
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      const red = new Uint32Array(256);
      const green = new Uint32Array(256);
      const blue = new Uint32Array(256);
      const luminance = new Uint32Array(256);
      let shadowClips = 0;
      let highlightClips = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        red[r] += 1;
        green[g] += 1;
        blue[b] += 1;
        luminance[l] += 1;
        if (l <= 2) shadowClips += 1;
        if (l >= 253) highlightClips += 1;
      }
      const pixelCount = Math.max(1, pixels.length / 4);
      setClipping({ shadows: (shadowClips / pixelCount) * 100, highlights: (highlightClips / pixelCount) * 100 });
      const max = Math.max(...red, ...green, ...blue, ...luminance, 1);
      output.width = 300;
      output.height = 104;
      outputContext.clearRect(0, 0, output.width, output.height);
      outputContext.fillStyle = "rgba(255,255,255,.02)";
      outputContext.fillRect(0, 0, output.width, output.height);
      const draw = (values: Uint32Array, color: string, width: number) => {
        outputContext.beginPath();
        outputContext.strokeStyle = color;
        outputContext.lineWidth = width;
        for (let value = 0; value < 256; value += 1) {
          const x = (value / 255) * output.width;
          const y = output.height - (values[value] / max) * (output.height - 6);
          if (value === 0) outputContext.moveTo(x, y);
          else outputContext.lineTo(x, y);
        }
        outputContext.stroke();
      };
      draw(luminance, "rgba(248,250,252,.38)", 1.6);
      draw(red, "rgba(248,113,113,.72)", 1.1);
      draw(green, "rgba(74,222,128,.68)", 1.1);
      draw(blue, "rgba(96,165,250,.76)", 1.1);
    };
    source.src = image.objectUrl;
    return () => {
      cancelled = true;
    };
  }, [adjustments, geometry, image]);

  return (
    <div className="histogram-wrap professional">
      <div className="histogram-head"><span>RGB + Luminance</span><small>Live shared renderer</small></div>
      {image ? <canvas ref={outputRef} aria-label="RGB and luminance histogram" /> : <div className="histogram-empty">Import an image to view tonal distribution.</div>}
      <div className="clipping-controls">
        <button className={clippingVisible && clipping.shadows > 0 ? "active" : ""} onClick={() => toggleCanvasFlag("clippingVisible")} title="Toggle shadow clipping warning"><TriangleAlert size={12} /><span>Shadows</span><output>{clipping.shadows.toFixed(1)}%</output></button>
        <button className={clippingVisible && clipping.highlights > 0 ? "active" : ""} onClick={() => toggleCanvasFlag("clippingVisible")} title="Toggle highlight clipping warning"><TriangleAlert size={12} /><span>Highlights</span><output>{clipping.highlights.toFixed(1)}%</output></button>
      </div>
      <dl className="histogram-metadata"><div><dt>ISO</dt><dd>{image?.iso ?? "—"}</dd></div><div><dt>Aperture</dt><dd>{image?.aperture ?? "—"}</dd></div><div><dt>Focal</dt><dd>{image?.focalLength ?? "—"}</dd></div><div><dt>Shutter</dt><dd>{image?.shutterSpeed ?? "—"}</dd></div></dl>
    </div>
  );
}
