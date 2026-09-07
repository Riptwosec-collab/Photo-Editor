import { renderStudio } from "./studio-renderer";
import type { StoredProject, ExportFormat, AspectRatio } from "../editor/types";
export type ExportOptions = { format: ExportFormat; quality: number; longEdge: number; aspectRatio?: AspectRatio; watermark: string; watermarkOpacity: number; background: string };
export async function prepareExport(canvas: HTMLCanvasElement, project: StoredProject, options: ExportOptions, signal?: AbortSignal) {
  await renderStudio(canvas, { blob: project.imageBlob, adjustments: project.adjustments, geometry: { ...project.geometry, aspectRatio: options.aspectRatio ?? project.geometry.aspectRatio }, layers: project.layers, limit: options.longEdge }, signal);
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  const ctx = canvas.getContext("2d")!;
  if (options.format === "image/jpeg") { ctx.save(); ctx.globalCompositeOperation = "destination-over"; ctx.fillStyle = options.background; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore(); }
  if (options.watermark.trim()) {
    ctx.save(); ctx.globalAlpha = options.watermarkOpacity; ctx.textAlign = "right";
    ctx.font = `600 ${Math.max(12, canvas.width * .025)}px sans-serif`; ctx.fillStyle = "white"; ctx.shadowColor = "#000"; ctx.shadowBlur = Math.max(2, canvas.width * .003); ctx.fillText(options.watermark.slice(0,120), canvas.width * .97, canvas.height * .95, canvas.width * .9); ctx.restore();
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, options.format, options.quality));
  if (!blob || blob.type !== options.format) throw new Error("This browser does not support the selected export format");
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  return blob;
}
export async function metadataSidecar(original: Blob, includeLocation: boolean) {
  const { parse } = await import("exifr");
  const metadata = await parse(original, { gps: includeLocation, exif: true, tiff: true, iptc: false, xmp: false }) ?? {};
  // Explicit allowlist: never leak unrequested location, serial numbers, or owner fields.
  const allowed = ["Make", "Model", "LensModel", "DateTimeOriginal", "ExposureTime", "FNumber", "ISO", "FocalLength"];
  if (includeLocation) allowed.push("latitude", "longitude", "GPSLatitude", "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef", "GPSAltitude");
  return new Blob([JSON.stringify(Object.fromEntries(allowed.filter((key) => key in metadata).map((key) => [key, metadata[key]])), null, 2)], { type: "application/json" });
}
