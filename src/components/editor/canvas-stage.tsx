"use client";

import { useEffect, useRef, useState } from "react";
import {
  Columns2,
  Focus,
  Grid3X3,
  Maximize2,
  Minus,
  Move,
  Plus,
  ScanLine,
  SquareDashed,
} from "lucide-react";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "@/features/editor/defaults";
import { renderToCanvas } from "@/features/editor/image-processing";
import { useEditorStore } from "@/features/editor/store";
import { useStudioStore } from "@/features/studio/store";
import { cn } from "@/lib/cn";

export function CanvasStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const editedRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement>(null);
  const gridRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const image = useEditorStore((state) => state.image);
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);
  const showOriginal = useEditorStore((state) => state.showOriginal);
  const zoom = useEditorStore((state) => state.zoom);
  const panX = useEditorStore((state) => state.panX);
  const panY = useEditorStore((state) => state.panY);
  const setZoom = useEditorStore((state) => state.setZoom);
  const setPan = useEditorStore((state) => state.setPan);
  const compareMode = useStudioStore((state) => state.compareMode);
  const comparePosition = useStudioStore((state) => state.comparePosition);
  const setComparePosition = useStudioStore((state) => state.setComparePosition);
  const gridVisible = useStudioStore((state) => state.gridVisible);
  const guidesVisible = useStudioStore((state) => state.guidesVisible);
  const safeZonesVisible = useStudioStore((state) => state.safeZonesVisible);
  const clippingVisible = useStudioStore((state) => state.clippingVisible);
  const maskOverlayVisible = useStudioStore((state) => state.maskOverlayVisible);
  const transparentBackground = useStudioStore((state) => state.transparentBackground);
  const softProof = useStudioStore((state) => state.softProof);
  const toggleCanvasFlag = useStudioStore((state) => state.toggleCanvasFlag);
  const [rendering, setRendering] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat) {
        const target = event.target as HTMLElement | null;
        if (target?.matches("input,textarea,select,button")) return;
        event.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!image || !editedRef.current || !originalRef.current) return;
    let cancelled = false;
    setRendering(true);
    const source = new Image();
    source.onload = () => {
      if (cancelled || !editedRef.current || !originalRef.current) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        try {
          renderToCanvas(source, source.naturalWidth, source.naturalHeight, editedRef.current!, adjustments, geometry);
          renderToCanvas(source, source.naturalWidth, source.naturalHeight, originalRef.current!, DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY);
          for (const [index, canvas] of gridRefs.current.entries()) {
            if (!canvas) continue;
            renderToCanvas(
              source,
              source.naturalWidth,
              source.naturalHeight,
              canvas,
              index % 2 === 0 ? DEFAULT_ADJUSTMENTS : adjustments,
              index % 2 === 0 ? DEFAULT_GEOMETRY : geometry,
              900,
            );
          }
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
  }, [adjustments, geometry, image]);

  if (!image) return null;

  function updateCompare(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = compareMode === "horizontal"
      ? ((event.clientY - rect.top) / rect.height) * 100
      : ((event.clientX - rect.left) / rect.width) * 100;
    setComparePosition(next);
  }

  const editedClip = compareMode === "vertical"
    ? { clipPath: `inset(0 0 0 ${comparePosition}%)` }
    : compareMode === "horizontal"
      ? { clipPath: `inset(${comparePosition}% 0 0 0)` }
      : undefined;

  return (
    <div
      ref={stageRef}
      className={cn(
        "professional-stage",
        transparentBackground && "transparent-bg",
        softProof && "soft-proof",
        spaceHeld && "space-pan",
      )}
    >
      <div
        className="canvas-viewport"
        onWheel={(event) => {
          event.preventDefault();
          const factor = event.deltaY < 0 ? 1.12 : 0.89;
          setZoom(zoom * factor);
        }}
        onDoubleClick={() => {
          if (zoom > 1.1) {
            setZoom(1);
            setPan(0, 0);
          } else {
            setZoom(2);
          }
        }}
        onPointerDown={(event) => {
          if (compareMode !== "off" && (event.target as HTMLElement).closest(".compare-handle")) return;
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
        {compareMode === "grid" ? (
          <div className="four-grid-compare" style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}>
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="grid-quadrant">
                <canvas ref={(element) => { gridRefs.current[index] = element; }} />
                <span>{index % 2 === 0 ? "Before" : "After"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="canvas-stack" style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}>
            <canvas ref={originalRef} className={cn("canvas-layer original", (showOriginal || compareMode === "blink") && "visible")} aria-label="Original image preview" />
            <canvas
              ref={editedRef}
              className={cn("canvas-layer edited", showOriginal && "hidden", compareMode === "blink" && !showOriginal && "visible")}
              style={showOriginal || compareMode === "blink" ? undefined : editedClip}
              aria-label="Edited image preview"
            />
            {(compareMode === "vertical" || compareMode === "horizontal") && !showOriginal && (
              <div
                className={cn("compare-handle", compareMode)}
                style={compareMode === "vertical" ? { left: `${comparePosition}%` } : { top: `${comparePosition}%` }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                  const viewport = event.currentTarget.parentElement?.parentElement;
                  if (!viewport) return;
                  const rect = viewport.getBoundingClientRect();
                  const next = compareMode === "horizontal"
                    ? ((event.clientY - rect.top) / rect.height) * 100
                    : ((event.clientX - rect.left) / rect.width) * 100;
                  setComparePosition(next);
                }}
              >
                <span><Columns2 size={12} /></span>
              </div>
            )}
            {compareMode !== "off" && compareMode !== "blink" && <><span className="compare-label before">Before</span><span className="compare-label after">After</span></>}
          </div>
        )}

        {gridVisible && <div className="canvas-grid-overlay" aria-hidden="true" />}
        {guidesVisible && <div className="canvas-guides-overlay" aria-hidden="true"><span /><span /></div>}
        {safeZonesVisible && <div className="safe-zone-overlay" aria-label="Safe zones" />}
        {clippingVisible && <div className="clipping-overlay" aria-label="Clipping warning preview"><span>Clipping preview</span></div>}
        {maskOverlayVisible && <div className="mask-preview-overlay" aria-label="Local radial mask preview"><span>Radial mask preview</span></div>}
        {rendering && <span className="render-badge">Rendering shared preview…</span>}
      </div>

      <div className="canvas-toolbar" role="toolbar" aria-label="Canvas tools">
        <button onClick={() => setZoom(zoom / 1.25)} aria-label="Zoom out" title="Zoom out"><Minus size={15} /></button>
        <output>{Math.round(zoom * 100)}%</output>
        <button onClick={() => setZoom(zoom * 1.25)} aria-label="Zoom in" title="Zoom in"><Plus size={15} /></button>
        <button onClick={() => { setZoom(1); setPan(0, 0); }} aria-label="Fit image" title="Fit"><Focus size={15} /><span>Fit</span></button>
        <button onClick={() => { setZoom(1); setPan(0, 0); }} aria-label="View at 100 percent" title="100%">100%</button>
        <button className={spaceHeld ? "active" : ""} aria-label="Pan tool" title="Hold Space to pan"><Move size={15} /></button>
        <span className="toolbar-separator" />
        <button className={gridVisible ? "active" : ""} onClick={() => toggleCanvasFlag("gridVisible")} aria-label="Toggle grid" title="Grid"><Grid3X3 size={15} /></button>
        <button className={guidesVisible ? "active" : ""} onClick={() => toggleCanvasFlag("guidesVisible")} aria-label="Toggle guides" title="Guides"><ScanLine size={15} /></button>
        <button className={safeZonesVisible ? "active" : ""} onClick={() => toggleCanvasFlag("safeZonesVisible")} aria-label="Toggle safe zones" title="Safe zones"><SquareDashed size={15} /></button>
        <button onClick={() => void stageRef.current?.requestFullscreen()} aria-label="Full screen" title="Full screen"><Maximize2 size={15} /></button>
      </div>

      <div className="camera-metadata-bar">
        <span>{image.rawType ?? image.type.split("/")[1]?.toUpperCase() ?? "IMAGE"}</span>
        <span>{image.width} × {image.height}</span>
        <span>ISO {image.iso ?? "—"}</span>
        <span>ƒ/{image.aperture ?? "—"}</span>
        <span>{image.focalLength ?? "—"}</span>
        <span>{image.shutterSpeed ?? "—"}</span>
      </div>
    </div>
  );
}
