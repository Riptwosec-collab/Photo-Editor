"use client";
import { T } from "@/features/i18n/text";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, RefreshCcw, FileImage } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listExportRecords, listProjects, saveExportRecord } from "@/lib/idb";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "@/features/editor/defaults";
import type { StoredProject, ExportRecord, ExportFormat, AspectRatio } from "@/features/editor/types";
import { prepareExport, metadataSidecar, type ExportOptions } from "@/features/render/export";
import { exportBackup, downloadBlob } from "@/features/projects/backup";
const presets = [
  { id: "instagram-feed", name: "Instagram Feed", format: "image/jpeg" as const, quality: .9, longEdge: 1350, aspectRatio: "4:5" as AspectRatio },
  { id: "web", name: "Web", format: "image/webp" as const, quality: .86, longEdge: 2048 },
  { id: "high-quality", name: "High Quality", format: "image/jpeg" as const, quality: .95, longEdge: 6000 },
  { id: "transparent", name: "PNG", format: "image/png" as const, quality: 1, longEdge: 6000 },
];
export function ExportCenter() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [presetId, setPresetId] = useState("instagram-feed");
  const [options, setOptions] = useState<ExportOptions>({ format: "image/jpeg", quality: .9, longEdge: 1350, aspectRatio: "4:5", watermark: "", watermarkOpacity: .7, background: "#ffffff" });
  const [prepared, setPrepared] = useState<{ key: string; blob: Blob; width: number; height: number } | null>(null);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [metadata, setMetadata] = useState(false);
  const [location, setLocation] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects,projectId]);
  const key = JSON.stringify({ id: project?.id, updated: project?.updatedAt, options });
  const ready = prepared?.key === key ? prepared : null;
  const refresh = useCallback(async () => {
    try { const rows = (await listProjects()).map((p) => ({ ...p, adjustments: { ...DEFAULT_ADJUSTMENTS, ...p.adjustments }, geometry: { ...DEFAULT_GEOMETRY, ...p.geometry } })); setProjects(rows); setProjectId((id) => rows.some((p) => p.id === id) ? id : rows[0]?.id ?? ""); setHistory(await listExportRecords()); }
    catch { setStatus("Unable to load saved projects"); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [refresh]);
  useEffect(() => {
    if (!project || !canvas.current) return;
    const controller = new AbortController(); const target = canvas.current;
    const timer = setTimeout(() => {
      setBusy(true); setStatus("Preparing full-resolution export…");
      void prepareExport(target, project, options, controller.signal).then((blob) => {
        if (!controller.signal.aborted) { setPrepared({ key, blob, width: target.width, height: target.height }); setStatus("Ready to download"); }
      }).catch((e) => { if (!controller.signal.aborted) setStatus(e instanceof Error ? e.message : "Export preview failed"); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [project, options, key]);
  async function download() {
    if (!project || !ready) return;
    const ext = options.format === "image/jpeg" ? "jpg" : options.format.split("/")[1];
    const filename = `${project.name.replace(/[^\p{L}\p{N}_-]+/gu,"-")}-${presetId}.${ext}`;
    try {
      // Generate optional metadata before triggering downloads, so errors cannot be mistaken for a completed export.
      const sidecar = metadata ? await metadataSidecar(project.imageBlob, location) : null;
      downloadBlob(ready.blob, filename);
      if (sidecar) downloadBlob(sidecar, `${filename}.metadata.json`);
      await saveExportRecord({ id: crypto.randomUUID(), projectId: project.id, createdAt: new Date().toISOString(), format: options.format, quality: options.quality, longEdge: options.longEdge, width: ready.width, height: ready.height, filename, colorSpace: "sRGB" });
      setHistory(await listExportRecords()); setStatus(`Exported ${filename} (${ready.width} × ${ready.height})`);
    } catch (e) { setStatus(e instanceof Error ? e.message : "Export failed"); }
  }
  return <AppShell><main className="export-page"><header className="project-heading"><div><span className="kicker"> <T text={"Your finished image"} /> </span><h1> <T text={"Export Center"} /> </h1><p>Layers, masks and text are included. The size below is measured from the encoded file. Original metadata is removed from the image; selected camera information can be saved as a separate JSON file.</p></div><button className="button" onClick={() => void refresh()}><RefreshCcw size={16} /> <T text={"Refresh"} /> </button></header><section className="export-layout"><div className="export-preview-card">{project ? <><canvas ref={canvas} aria-label="Export preview" /><strong>{project.name}</strong><small>{ready ? `${ready.width} × ${ready.height} · ${(ready.blob.size / 1048576).toFixed(2)} MB` : "Preparing preview…"}</small></> : <div className="empty-state"><FileImage /><h2> <T text={"No saved project"} /> </h2><p> <T text={"Save an image from the editor first."} /> </p></div>}</div><div className="export-settings"><label> <T text={"Project"} /> <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="export-presets">{presets.map((p) => <button className={presetId === p.id ? "active" : ""} key={p.id} onClick={() => { setPresetId(p.id); setOptions((o) => ({ ...o, format: p.format, quality: p.quality, longEdge: p.longEdge, aspectRatio: p.aspectRatio })); }}>{p.name}</button>)}</div><label> <T text={"Format"} /> <select value={options.format} onChange={(e) => setOptions((o) => ({ ...o, format: e.target.value as ExportFormat }))}><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><label> <T text={"Quality"} /> {Math.round(options.quality*100)}%<input type="range" min=".1" max="1" step=".01" disabled={options.format === "image/png"} value={options.quality} onChange={(e) => setOptions((o) => ({ ...o, quality: +e.target.value }))} /></label><label> <T text={"Long edge (pixels)"} /> <input type="number" min="64" max="6000" value={options.longEdge} onChange={(e) => setOptions((o) => ({ ...o, longEdge: Math.max(64,Math.min(6000,+e.target.value)) }))} /></label><label> <T text={"Watermark"} /> <input maxLength={120} value={options.watermark} onChange={(e) => setOptions((o) => ({ ...o, watermark: e.target.value }))} placeholder="Your name or studio" /></label><label> <T text={"Watermark opacity"} /> <input type="range" min=".1" max="1" step=".05" value={options.watermarkOpacity} onChange={(e) => setOptions((o) => ({ ...o, watermarkOpacity: +e.target.value }))} /></label><label> <T text={"JPEG background"} /> <input type="color" value={options.background} onChange={(e) => setOptions((o) => ({ ...o, background: e.target.value }))} /></label><label><input type="checkbox" checked={metadata} onChange={(e) => setMetadata(e.target.checked)} /> <T text={"Save camera metadata as JSON"} /> </label><label><input type="checkbox" checked={location} disabled={!metadata} onChange={(e) => setLocation(e.target.checked)} /> <T text={"Include GPS location in JSON"} /> </label><button className="button primary" disabled={!ready || busy} onClick={() => void download()}><Download size={16} /> <T text={"Export and download"} /> </button><button className="button" disabled={!project} onClick={() => { if (project) void exportBackup(project).then((blob) => downloadBlob(blob, `${project.name}.lumaforge.json`)).catch(() => setStatus("Backup failed")); }}> <T text={"Download editable project backup"} /> </button></div></section><p className="export-status" role="status"><T text={status} /></p><section className="export-history"><h2> <T text={"Export history"} /> </h2>{history.slice(0,20).map((row) => <div key={row.id}><strong>{row.filename}</strong><small>{row.width} × {row.height} · {new Date(row.createdAt).toLocaleString()}</small></div>)}</section></main></AppShell>;
}
