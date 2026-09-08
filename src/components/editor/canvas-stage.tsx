"use client";
import { T } from "@/features/i18n/text";


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
import { DEFAULT_ADJUSTMENTS } from "@/features/editor/defaults";
import { renderStudio } from "@/features/render/studio-renderer";
import { TransformOverlay } from "./transform-overlay";
import { MaskCanvas } from "./mask-canvas";
import { useEditorStore } from "@/features/editor/store";
import { usePreferences } from "@/features/studio/preferences";
import { useStudioStore } from "@/features/studio/store";
import { cn } from "@/lib/cn";

export function CanvasStage() {
  const performanceMode = usePreferences((s) => s.performanceMode);
  const blobCache = useRef<{ url: string; value: Promise<Blob> } | null>(null);
  const layers = useEditorStore((s) => s.layers);
  const maskEditing = useEditorStore((s) => s.maskEditing);
  const committed = useEditorStore((s) => s.committed);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number; x: number; y: number; px: number; py: number } | null>(null);
  const [renderError, setRenderError] = useState("");
  const [panEnabled, setPanEnabled] = useState(false);
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
    if (!image) return;
    const controller = new AbortController();
    const moving = adjustments !== committed.adjustments && JSON.stringify(adjustments) !== JSON.stringify(committed.adjustments);
    const timer = setTimeout(async () => {
      setRendering(true); setRenderError("");
      try {
        if (blobCache.current?.url !== image.objectUrl) blobCache.current = { url: image.objectUrl, value: fetch(image.objectUrl).then((r) => r.blob()) };
        const blob = await blobCache.current.value;
        const limit = moving ? 720 : performanceMode ? 1000 : 1800;
        const targets = compareMode === "grid" ? gridRefs.current.map((canvas, i) => ({ canvas, before: i % 2 === 0 })) : [{ canvas: originalRef.current, before: true }, { canvas: editedRef.current, before: false }];
        for (const { canvas, before } of targets) {
          if (controller.signal.aborted) return;
          if (canvas) await renderStudio(canvas, { blob, sourceWidth:image.width,sourceHeight:image.height, adjustments: before ? DEFAULT_ADJUSTMENTS : adjustments, geometry, layers: before ? [] : layers, limit: compareMode === "grid" ? Math.min(900, limit) : limit }, controller.signal);
        }
      } catch (error) { if (!controller.signal.aborted) setRenderError(error instanceof Error ? error.message : "Render failed"); }
      finally { if (!controller.signal.aborted) setRendering(false); }
    }, moving ? 45 : 120);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [adjustments, geometry, image, compareMode, performanceMode, layers, committed]);

  if (!image) return null;

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

        (spaceHeld || panEnabled) && "space-pan",
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
          if (maskEditing || (event.target as HTMLElement).closest(".compare-handle")) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          event.currentTarget.setPointerCapture(event.pointerId);
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, px: panX, py: panY }; drag.current = null;
          } else drag.current = { x: event.clientX, y: event.clientY, px: panX, py: panY };
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2 && pinch.current) {
            const [a,b] = [...pointers.current.values()]; const p = pinch.current;
            setZoom(p.zoom * Math.hypot(a.x-b.x, a.y-b.y) / Math.max(1, p.distance));
            setPan(p.px + (a.x+b.x)/2-p.x, p.py + (a.y+b.y)/2-p.y); return;
          }
          if (drag.current) setPan(drag.current.px + event.clientX - drag.current.x, drag.current.py + event.clientY - drag.current.y);
        }}
        onPointerCancel={(event) => { pointers.current.delete(event.pointerId); drag.current = null; pinch.current = null; }}
        onPointerUp={(event) => { pointers.current.delete(event.pointerId); drag.current = null; pinch.current = null; }}

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
            {maskEditing && <MaskCanvas />}{!maskEditing && !showOriginal && compareMode === "off" && <TransformOverlay />}
            {(compareMode === "vertical" || compareMode === "horizontal") && !showOriginal && (
              <div
                role="slider"
                tabIndex={0}
                aria-label="Before and after comparison"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(comparePosition)}
                aria-orientation={compareMode === "horizontal" ? "vertical" : "horizontal"}
                onKeyDown={(event) => {
                  if (["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "Home", "End"].includes(event.key)) {
                    event.preventDefault();
                    setComparePosition(event.key === "Home" ? 0 : event.key === "End" ? 100 : comparePosition + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -2 : 2));
                  }
                }}
                className={cn("compare-handle", compareMode)}
                style={compareMode === "vertical" ? { left: `${comparePosition}%` } : { top: `${comparePosition}%` }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                  const viewport = event.currentTarget.parentElement;
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
            {compareMode !== "off" && compareMode !== "blink" && <><span className="compare-label before"> <T text={"Before"} /> </span><span className="compare-label after"> <T text={"After"} /> </span></>}
          </div>
        )}

        {gridVisible && <div className="canvas-grid-overlay" aria-hidden="true" />}
        {guidesVisible && <div className="canvas-guides-overlay" aria-hidden="true"><span /><span /></div>}
        {safeZonesVisible && <div className="safe-zone-overlay" aria-label="Safe zones" />}
        {clippingVisible && <div className="clipping-overlay" aria-label="Clipping warning preview"><span> <T text={"Clipping preview"} /> </span></div>}
        {maskOverlayVisible && <div className="mask-preview-overlay" aria-label="Local radial mask preview"><span>Radial mask preview</span></div>}
        {renderError && <span className="render-badge" role="alert">{renderError}</span>}
        {rendering && <span className="render-badge"> <T text={"Rendering shared preview…"} /> </span>}
      </div>

      <div className="canvas-toolbar" role="toolbar" aria-label="Canvas tools">
        <button onClick={() => setZoom(zoom / 1.25)} aria-label="Zoom out" title="Zoom out"><Minus size={15} /></button>
        <output>{Math.round(zoom * 100)}%</output>
        <button onClick={() => setZoom(zoom * 1.25)} aria-label="Zoom in" title="Zoom in"><Plus size={15} /></button>
        <button onClick={() => { setZoom(1); setPan(0, 0); }} aria-label="Fit image" title="Fit"><Focus size={15} /><span> <T text={"Fit"} /> </span></button>
        <button onClick={() => { setZoom(1); setPan(0, 0); }} aria-label="View at 100 percent" title="100%">100%</button>
        <button onClick={() => setPanEnabled(!panEnabled)} aria-pressed={panEnabled} className={spaceHeld || panEnabled ? "active" : ""} aria-label="Pan tool" title="Hold Space to pan"><Move size={15} /></button>
        <span className="toolbar-separator" />
        <button className={gridVisible ? "active" : ""} onClick={() => toggleCanvasFlag("gridVisible")} aria-label="Toggle grid" title="Grid"><Grid3X3 size={15} /></button>
        <button className={guidesVisible ? "active" : ""} onClick={() => toggleCanvasFlag("guidesVisible")} aria-label="Toggle guides" title="Guides"><ScanLine size={15} /></button>
        <button className={safeZonesVisible ? "active" : ""} onClick={() => toggleCanvasFlag("safeZonesVisible")} aria-label="Toggle safe zones" title="Safe zones"><SquareDashed size={15} /></button>
        <button onClick={() => void stageRef.current?.requestFullscreen?.().catch(() => setRenderError("Full screen is unavailable in this browser"))} aria-label="Full screen" title="Full screen"><Maximize2 size={15} /></button>
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
