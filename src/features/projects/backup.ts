import { z } from "zod";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "../editor/defaults";
import type { StoredProject, Adjustments, EditorLayer } from "../editor/types";
import { saveProject } from "@/lib/idb";
export const imageData = z.string().max(48_000_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/);
const point = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });
export const layersSchema = z.array(z.object({
  id: z.string().max(100), name: z.string().max(100), kind: z.enum(["adjustment", "text", "raster"]), visible: z.boolean(), opacity: z.number().min(0).max(1),
  adjustments: z.record(z.string(), z.number().min(-360).max(360)),
  mask: z.object({ edgeShift: z.number().min(-1).max(1).optional(), edgeContrast: z.number().min(0).max(1).optional(), kind: z.enum(["all", "radial", "linear", "brush", "image"]), dataUrl: imageData.optional(), x: z.number().min(0).max(1), y: z.number().min(0).max(1), radius: z.number().min(.001).max(2), feather: z.number().min(0).max(1), invert: z.boolean(), strokes: z.array(z.object({ points: z.array(point).max(3000), radius: z.number().min(.001).max(.5), erase: z.boolean().optional() })).max(500) }),
  transform: z.object({x:z.number().min(-1).max(1),y:z.number().min(-1).max(1),scale:z.number().min(.1).max(4),rotation:z.number().min(-180).max(180)}).optional(),
  locked: z.boolean().optional(), group: z.string().max(80).optional(), textAlign: z.enum(["left","center","right"]).optional(),
  replaceBase: z.boolean().optional(),
  retouchMode: z.enum(["clone","heal"]).optional(), decontaminate: z.number().min(0).max(1).optional(),
  colorReplace: z.object({color:z.string().regex(/^#[a-fA-F0-9]{6}$/),strength:z.number().min(0).max(1)}).optional(),
  channelCurves: z.object({ red: z.array(z.number().min(0).max(1)).length(5), green: z.array(z.number().min(0).max(1)).length(5), blue: z.array(z.number().min(0).max(1)).length(5) }).optional(),
  lut: z.object({title:z.string().max(100),size:z.number().int().min(2).max(33),domainMin:z.array(z.number().finite()).length(3),domainMax:z.array(z.number().finite()).length(3),values:z.array(z.number().min(-100).max(100)).max(33**3*3)}).refine(l=>l.values.length===l.size**3*3 && l.domainMax.every((n,i)=>n>l.domainMin[i]),"Invalid LUT").optional(),
  retouch: z.array(z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1),radius:z.number().min(.001).max(.2),sourceX:z.number().min(0).max(1),sourceY:z.number().min(0).max(1),mode:z.enum(["clone","heal"]).optional()})).max(300).optional(),
  text: z.string().max(500).optional(), color: z.string().regex(/^#[a-fA-F0-9]{6}$/).optional(), fontSize: z.number().min(.005).max(.5).optional(), x: z.number().min(0).max(1).optional(), y: z.number().min(0).max(1).optional(), dataUrl: imageData.optional(),
})).max(20);
export function blobToDataUrl(blob: Blob): Promise<string> { return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(blob); }); }
export function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
export async function exportBackup(project: StoredProject) {
  const { imageBlob, ...recipe } = project;
  return new Blob([JSON.stringify({ type: "lumaforge-project", version: 2, project: recipe, original: await blobToDataUrl(imageBlob) })], { type: "application/json" });
}
export async function importBackup(file: File): Promise<StoredProject> {
  if (file.size > 80 * 1024 * 1024) throw new Error("Project backup exceeds 80 MB");
  const input = z.object({ type: z.literal("lumaforge-project"), version: z.literal(2), original: imageData, project: z.object({ name: z.string().min(1).max(160), album: z.string().max(80).optional(), tags: z.array(z.string().max(40)).max(20).optional(), imageName: z.string().max(200), imageType: z.enum(["image/png", "image/jpeg", "image/webp"]), width: z.number().int().positive().max(30000), height: z.number().int().positive().max(30000), adjustments: z.record(z.string(), z.number().min(-360).max(360)), geometry: z.object({ perspectiveMode: z.enum(["shear","projective"]).optional(), rotation: z.union([z.literal(0),z.literal(90),z.literal(180),z.literal(270)]), flipX: z.boolean(), flipY: z.boolean(), aspectRatio: z.enum(["original","free","1:1","4:5","16:9","9:16"]), straighten: z.number().min(-45).max(45), cropX: z.number().min(0).max(1), cropY: z.number().min(0).max(1), cropWidth: z.number().min(.01).max(1), cropHeight: z.number().min(.01).max(1), perspectiveX: z.number().min(-100).max(100), perspectiveY: z.number().min(-100).max(100) }), layers: layersSchema.optional() }) }).parse(JSON.parse(await file.text()));
  const imageBlob = await fetch(input.original).then((r) => r.blob());
  const decoded = await createImageBitmap(imageBlob);
  if (decoded.width * decoded.height > 60_000_000) { decoded.close(); throw new Error("Image exceeds 60 megapixels"); }
  const now = new Date().toISOString();
  const adjustments = Object.fromEntries(Object.keys(DEFAULT_ADJUSTMENTS).map((key) => [key, input.project.adjustments[key] ?? 0])) as Adjustments;
  const project: StoredProject = { ...input.project, id: crypto.randomUUID(), createdAt: now, updatedAt: now, width: decoded.width, height: decoded.height, imageBlob, imageType: imageBlob.type, adjustments, geometry: { ...DEFAULT_GEOMETRY, ...input.project.geometry }, layers: input.project.layers as EditorLayer[] ?? [] };
  decoded.close(); await saveProject(project); return project;
}
