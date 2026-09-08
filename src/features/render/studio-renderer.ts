import type { Adjustments, Geometry, EditorLayer } from "../editor/types";
import { renderToCanvas } from "../editor/image-processing";
import { compositeLayers } from "./layers";
export type RenderRequest = { blob: Blob; adjustments: Adjustments; geometry: Geometry; layers?: EditorLayer[]; sourceWidth?:number; sourceHeight?:number; limit: number };
import { renderQueue } from "./render-queue";
export async function renderStudio(canvas: HTMLCanvasElement, request: RenderRequest, signal?: AbortSignal) {
 const release=await renderQueue.acquire(signal);
 try { return await renderNow(canvas,request,signal); } finally { release(); }
}
async function renderNow(canvas: HTMLCanvasElement, request: RenderRequest, signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Render cancelled", "AbortError");
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
    try {
      const bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
        const worker = new Worker(new URL("./renderer.worker.ts", import.meta.url), { type: "module" });
        const dispose = () => { worker.terminate(); signal?.removeEventListener("abort", cancel); };
        const cancel = () => { dispose(); reject(new DOMException("Render cancelled", "AbortError")); };
        signal?.addEventListener("abort", cancel, { once: true });
        worker.onmessage = (event) => { dispose(); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.bitmap); };
        worker.onerror = () => { dispose(); reject(new Error("Worker unavailable")); };
        worker.postMessage(request);
      });
      if (signal?.aborted) { bitmap.close(); throw new DOMException("Render cancelled", "AbortError"); }
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0); bitmap.close();
      return { width: canvas.width, height: canvas.height };
    } catch (error) { if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) throw error; }
  }
  // Older browsers retain the exact same renderer and layer behavior.
  const url = URL.createObjectURL(request.blob);
  try {
    const source = new Image(); source.src = url; await source.decode();
    if (signal?.aborted) throw new DOMException("Render cancelled", "AbortError");
    const buffer = document.createElement("canvas");
    renderToCanvas(source, source.naturalWidth, source.naturalHeight, buffer, request.adjustments, request.geometry, request.limit);
    await compositeLayers(buffer, request.layers);
    if (signal?.aborted) throw new DOMException("Render cancelled", "AbortError");
    canvas.width = buffer.width; canvas.height = buffer.height; canvas.getContext("2d")!.drawImage(buffer, 0, 0);
    return { width: canvas.width, height: canvas.height };
  } finally { URL.revokeObjectURL(url); }
}
