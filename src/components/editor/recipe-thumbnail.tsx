"use client";
import { useEffect, useRef } from "react";
import { renderStudio } from "@/features/render/studio-renderer";
import { DEFAULT_GEOMETRY, DEFAULT_ADJUSTMENTS } from "@/features/editor/defaults";
import type { Adjustments, Geometry, EditorLayer } from "@/features/editor/types";
export function RecipeThumbnail({ url, adjustments, geometry = DEFAULT_GEOMETRY, layers = [], limit = 180 }: { url?: string; adjustments: Partial<Adjustments>; geometry?: Geometry; layers?: EditorLayer[]; limit?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Values are serialized to keep thumbnails independent of unrelated store changes.
  const recipe = JSON.stringify({ adjustments, geometry, layers, limit });
  useEffect(() => {
    if (!url || !ref.current) return;
    const controller = new AbortController();
    const canvas = ref.current;
    const parsed = JSON.parse(recipe);
    const start = () => { void fetch(url, { signal: controller.signal }).then((r) => r.blob()).then((blob) => renderStudio(canvas, { blob, adjustments: { ...DEFAULT_ADJUSTMENTS, ...parsed.adjustments }, geometry: parsed.geometry, layers: parsed.layers, limit: parsed.limit }, controller.signal)).catch(() => {}); };
    if (typeof IntersectionObserver === "undefined") { start(); return () => controller.abort(); }
    const observer = new IntersectionObserver(entries => { if(entries.some(e=>e.isIntersecting)) { observer.disconnect();start(); } }, {rootMargin:"100px"});
    observer.observe(canvas);
    return () => { observer.disconnect();controller.abort(); };
  }, [url, recipe]);
  return <canvas ref={ref} className="recipe-thumbnail" width={180} height={120} aria-label="Recipe thumbnail" />;
}
