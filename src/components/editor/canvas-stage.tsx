"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "@/features/editor/defaults";
import { renderToCanvas } from "@/features/editor/image-processing";
import { useEditorStore } from "@/features/editor/store";

export function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const image = useEditorStore((state) => state.image);
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);
  const showOriginal = useEditorStore((state) => state.showOriginal);
  const zoom = useEditorStore((state) => state.zoom);
  const panX = useEditorStore((state) => state.panX);
  const panY = useEditorStore((state) => state.panY);
  const setZoom = useEditorStore((state) => state.setZoom);
  const setPan = useEditorStore((state) => state.setPan);
  const [rendering, setRendering] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    let cancelled = false;
    setRendering(true);
    const source = new Image();
    source.onload = () => {
      if (cancelled || !canvasRef.current) return;
      requestAnimationFrame(() => {
        try {
          renderToCanvas(
            source,
            source.naturalWidth,
            source.naturalHeight,
            canvasRef.current!,
            showOriginal ? DEFAULT_ADJUSTMENTS : adjustments,
            showOriginal ? DEFAULT_GEOMETRY : geometry,
          );
        } finally {
          setRendering(false);
        }
      });
    };
    source.onerror = () => setRendering(false);
    source.src = image.objectUrl;
    return () => {
      cancelled = true;
    };
  }, [adjustments, geometry, image, showOriginal]);

  if (!image) return null;

  return (
    <div className="stage">
      <div
        className="canvas-viewport"
        onWheel={(event) => {
          event.preventDefault();
          setZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
        }}
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, px: panX, py: panY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setPan(
            drag.current.px + event.clientX - drag.current.x,
            drag.current.py + event.clientY - drag.current.y,
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
          aria-label="Edited image preview"
        />
        {rendering && <span className="render-badge">Rendering preview…</span>}
      </div>
      <div className="zoom-bar">
        <button onClick={() => setZoom(zoom - 0.25)} aria-label="Zoom out"><Minus size={15} /></button>
        <output>{Math.round(zoom * 100)}%</output>
        <button onClick={() => setZoom(zoom + 0.25)} aria-label="Zoom in"><Plus size={15} /></button>
        <button onClick={() => { setZoom(1); setPan(0, 0); }} aria-label="Fit image"><Maximize2 size={15} /></button>
      </div>
    </div>
  );
}
