import { healPatch, refineCoverage, cleanEdgeColors, featherCoverage } from "./retouch";
import { applyProColor } from "../editor/color-tools";
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
const maskDraws = new WeakMap<Surface, number>();
export async function drawMask(canvas: Surface, mask: LayerMask) {
  const drawId = (maskDraws.get(canvas) ?? 0) + 1; maskDraws.set(canvas, drawId);
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
  if ((mask.kind === "image" || mask.kind === "brush") && mask.dataUrl) {
    const bitmap=await createImageBitmap(await fetch(mask.dataUrl).then(r=>r.blob()));
    if(maskDraws.get(canvas)!==drawId){bitmap.close();return;}
    ctx.drawImage(bitmap,0,0,w,h);bitmap.close();
  }
  if (mask.kind === "brush") for (const stroke of mask.strokes) {
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.lineWidth = stroke.radius * Math.min(w, h) * 2; ctx.strokeStyle = "white"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); stroke.points.forEach((p, index) => { if (!index) ctx.moveTo(p.x * w, p.y * h); else ctx.lineTo(p.x * w, p.y * h); });
    if (stroke.points.length === 1) { const p = stroke.points[0]; ctx.lineTo(p.x * w + .01, p.y * h); }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  if (mask.feather && (mask.kind === "brush" || mask.kind === "image")) ctx.putImageData(featherCoverage(ctx.getImageData(0,0,w,h),mask.feather*Math.min(w,h)*.025),0,0);
  if (mask.edgeShift || mask.edgeContrast) ctx.putImageData(refineCoverage(ctx.getImageData(0,0,w,h),mask.edgeShift,mask.edgeContrast),0,0);
  if (mask.invert) {
    ctx.globalCompositeOperation = "source-out"; ctx.fillStyle = "white"; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "source-over";
  }
}
export async function compositeLayers(canvas: Surface, layers: EditorLayer[] = []) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true, colorSpace: "srgb" }) as Context;
  const w = canvas.width, h = canvas.height;
  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    const overlay = surface(w, h); const out = overlay.getContext("2d") as Context;
    if (layer.kind === "adjustment") {
      const data = ctx.getImageData(0, 0, w, h);
      if (layer.lut || layer.channelCurves) applyProColor(data, layer.channelCurves, layer.lut);
      const recipe = { ...DEFAULT_ADJUSTMENTS, ...layer.adjustments };
      out.putImageData(applyDetailFilters(processImageData(data, recipe), w, h, recipe.sharpness, recipe.noiseReduction, recipe.texture), 0, 0);
    } else if (layer.kind === "text") {
      out.fillStyle = layer.color ?? "#ffffff"; out.font = `600 ${Math.max(1, (layer.fontSize ?? .055) * w)}px sans-serif`; out.textAlign = "center"; out.fillText(layer.text ?? "", (layer.x ?? .5) * w, (layer.y ?? .8) * h, w * .95);
    } else if (layer.dataUrl) {
      const blob = await fetch(layer.dataUrl).then((r) => r.blob());
      const bitmap = await createImageBitmap(blob); out.drawImage(bitmap, 0, 0, w, h); bitmap.close();
    }
    if (layer.colorReplace) {
      out.save(); out.globalCompositeOperation="color"; out.globalAlpha=layer.colorReplace.strength;
      out.fillStyle=layer.colorReplace.color; out.fillRect(0,0,w,h); out.restore();
    }
    // Clone spots are composited from the unmodified input of this layer, with feathered edges.
    for (const spot of layer.retouch ?? []) {
      const radius = Math.max(1, spot.radius * Math.min(w,h));
      const patch = surface(Math.ceil(radius*2), Math.ceil(radius*2)); const pc = patch.getContext("2d") as Context;
      pc.drawImage(canvas, spot.sourceX*w-radius, spot.sourceY*h-radius, radius*2, radius*2, 0, 0, radius*2, radius*2);
      if (spot.mode === "heal") {
        const target = surface(patch.width,patch.height); const tc = target.getContext("2d") as Context;
        tc.drawImage(canvas,spot.x*w-radius,spot.y*h-radius,radius*2,radius*2,0,0,radius*2,radius*2);
        pc.putImageData(healPatch(pc.getImageData(0,0,patch.width,patch.height),tc.getImageData(0,0,patch.width,patch.height)),0,0);
        target.width=0;target.height=0;
      }
      const fade=pc.createRadialGradient(radius,radius,radius*.55,radius,radius,radius); fade.addColorStop(0,"white");fade.addColorStop(1,"transparent");
      pc.globalCompositeOperation="destination-in";pc.fillStyle=fade;pc.fillRect(0,0,patch.width,patch.height);
      out.drawImage(patch,spot.x*w-radius,spot.y*h-radius); patch.width=0;patch.height=0;
    }
    const mask = surface(w, h); await drawMask(mask, layer.mask);
    out.globalCompositeOperation = "destination-in"; out.drawImage(mask, 0, 0);
    if (layer.decontaminate) out.putImageData(cleanEdgeColors(out.getImageData(0,0,w,h),layer.decontaminate),0,0);
    const transform = () => {
      const t=layer.transform; if (!t) return;
      ctx.translate(w*(.5+t.x),h*(.5+t.y));ctx.rotate(t.rotation*Math.PI/180);ctx.scale(t.scale,t.scale);ctx.translate(-w/2,-h/2);
    };
    // Raster outputs replace selected pixels, allowing transparent AI cutouts.
    if (layer.kind === "raster" && layer.replaceBase !== false) { ctx.save(); ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = layer.opacity; transform(); ctx.drawImage(mask, 0, 0); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = layer.opacity; transform(); ctx.drawImage(overlay, 0, 0); ctx.restore();
    overlay.width=0;overlay.height=0;mask.width=0;mask.height=0;
  }
}
