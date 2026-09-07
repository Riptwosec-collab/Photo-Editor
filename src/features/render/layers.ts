import { DEFAULT_ADJUSTMENTS } from "../editor/defaults";
import { processImageData, applyDetailFilters } from "../editor/image-processing";
import type { EditorLayer, LayerMask } from "../editor/types";
type Surface = HTMLCanvasElement | OffscreenCanvas;
type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export const defaultMask = (): LayerMask => ({ kind: "all", x: .5, y: .5, radius: .35, feather: .6, invert: false, strokes: [] });
export function createLayer(kind: EditorLayer["kind"] = "adjustment"): EditorLayer {
  return { id: crypto.randomUUID(), name: kind === "text" ? "Text" : kind === "raster" ? "AI result" : "Local light", kind, visible: true, opacity: 1, adjustments: { exposure: .3 }, mask: defaultMask(), text: "Your story", color: "#ffffff", fontSize: .055, x: .5, y: .8 };
}
function surface(width: number, height: number): Surface {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; return canvas;
}
export function drawMask(canvas: Surface, mask: LayerMask) {
  const ctx = canvas.getContext("2d") as Context;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "white";
  if (mask.kind === "all") ctx.fillRect(0, 0, w, h);
  if (mask.kind === "radial") {
    const radius = Math.max(1, mask.radius * Math.min(w, h));
    const gradient = ctx.createRadialGradient(mask.x * w, mask.y * h, radius * (1 - Math.min(.99, mask.feather)), mask.x * w, mask.y * h, radius);
    gradient.addColorStop(0, "white"); gradient.addColorStop(1, "transparent"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  }
  if (mask.kind === "linear") {
    const span = Math.max(.02, mask.feather) * h;
    const gradient = ctx.createLinearGradient(0, mask.y * h - span / 2, 0, mask.y * h + span / 2);
    gradient.addColorStop(0, "white"); gradient.addColorStop(1, "transparent"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  }
  if (mask.kind === "brush") for (const stroke of mask.strokes) {
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.lineWidth = stroke.radius * Math.min(w, h) * 2; ctx.strokeStyle = "white"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); stroke.points.forEach((p, index) => { if (!index) ctx.moveTo(p.x * w, p.y * h); else ctx.lineTo(p.x * w, p.y * h); });
    if (stroke.points.length === 1) { const p = stroke.points[0]; ctx.lineTo(p.x * w + .01, p.y * h); }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  if (mask.invert) {
    ctx.globalCompositeOperation = "source-out"; ctx.fillStyle = "white"; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "source-over";
  }
}
export async function compositeLayers(canvas: Surface, layers: EditorLayer[] = []) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as Context;
  const w = canvas.width, h = canvas.height;
  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    const overlay = surface(w, h); const out = overlay.getContext("2d") as Context;
    if (layer.kind === "adjustment") {
      const data = ctx.getImageData(0, 0, w, h);
      const recipe = { ...DEFAULT_ADJUSTMENTS, ...layer.adjustments };
      out.putImageData(applyDetailFilters(processImageData(data, recipe), w, h, recipe.sharpness, recipe.noiseReduction, recipe.texture), 0, 0);
    } else if (layer.kind === "text") {
      out.fillStyle = layer.color ?? "#ffffff"; out.font = `600 ${Math.max(1, (layer.fontSize ?? .055) * w)}px sans-serif`; out.textAlign = "center"; out.fillText(layer.text ?? "", (layer.x ?? .5) * w, (layer.y ?? .8) * h, w * .95);
    } else if (layer.dataUrl) {
      const blob = await fetch(layer.dataUrl).then((r) => r.blob());
      const bitmap = await createImageBitmap(blob); out.drawImage(bitmap, 0, 0, w, h); bitmap.close();
    }
    const mask = surface(w, h); drawMask(mask, layer.mask);
    out.globalCompositeOperation = "destination-in"; out.drawImage(mask, 0, 0);
    // Raster outputs replace selected pixels, allowing transparent AI cutouts.
    if (layer.kind === "raster") { ctx.save(); ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = layer.opacity; ctx.drawImage(mask, 0, 0); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = layer.opacity; ctx.drawImage(overlay, 0, 0); ctx.restore();
  }
}
