"use client";

import { useEffect, useRef } from "react";
import { renderToCanvas } from "@/features/editor/image-processing";
import { useEditorStore } from "@/features/editor/store";

export function Histogram() {
  const outputRef = useRef<HTMLCanvasElement>(null);
  const image = useEditorStore((state) => state.image);
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);

  useEffect(() => {
    if (!image || !outputRef.current) return;
    let cancelled = false;
    const source = new Image();
    source.onload = () => {
      if (cancelled || !outputRef.current) return;
      const sample = document.createElement("canvas");
      renderToCanvas(
        source,
        source.naturalWidth,
        source.naturalHeight,
        sample,
        adjustments,
        geometry,
        320,
      );
      const context = sample.getContext("2d", { willReadFrequently: true });
      const output = outputRef.current;
      const outputContext = output.getContext("2d");
      if (!context || !outputContext) return;
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      const red = new Uint32Array(256);
      const green = new Uint32Array(256);
      const blue = new Uint32Array(256);
      for (let index = 0; index < pixels.length; index += 4) {
        red[pixels[index]] += 1;
        green[pixels[index + 1]] += 1;
        blue[pixels[index + 2]] += 1;
      }
      const max = Math.max(...red, ...green, ...blue, 1);
      output.width = 280;
      output.height = 92;
      outputContext.clearRect(0, 0, output.width, output.height);
      outputContext.fillStyle = "rgba(255,255,255,.025)";
      outputContext.fillRect(0, 0, output.width, output.height);
      const draw = (values: Uint32Array, color: string) => {
        outputContext.beginPath();
        outputContext.strokeStyle = color;
        outputContext.lineWidth = 1.2;
        for (let index = 0; index < 256; index += 1) {
          const x = (index / 255) * output.width;
          const y = output.height - (values[index] / max) * (output.height - 6);
          if (index === 0) outputContext.moveTo(x, y);
          else outputContext.lineTo(x, y);
        }
        outputContext.stroke();
      };
      draw(red, "rgba(248,113,113,.75)");
      draw(green, "rgba(74,222,128,.7)");
      draw(blue, "rgba(96,165,250,.78)");
    };
    source.src = image.objectUrl;
    return () => {
      cancelled = true;
    };
  }, [adjustments, geometry, image]);

  return (
    <div className="histogram-wrap">
      <div className="histogram-head"><span>RGB histogram</span><small>Live preview</small></div>
      {image ? <canvas ref={outputRef} aria-label="RGB histogram" /> : <div className="histogram-empty">Import an image to view tonal distribution.</div>}
    </div>
  );
}
