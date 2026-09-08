"use client";
import { IMAGE_ACCEPT, isSupportedImage, normalizeImage } from "@/features/editor/import-image";
import { T } from "@/features/i18n/text";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileImage, Play, CirclePause, Download, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY, PRESETS } from "@/features/editor/defaults";
import { useEditorStore } from "@/features/editor/store";
import type { Adjustments, StoredProject } from "@/features/editor/types";
import { prepareExport } from "@/features/render/export";
import { putRecord, getRecord } from "@/lib/local-records";
import { downloadBlob } from "@/features/projects/backup";
import { zip } from "fflate";
type BatchItem = { id: string; file: File; selected: boolean; status: "waiting" | "processing" | "complete" | "error"; presetId: string; output?: Blob; error?: string };
const light = new Set(["exposure","contrast","highlights","shadows","whites","blacks","brightness","gamma","dynamicRange","midtoneContrast","highlightRecovery","shadowRecovery"]);
export function BatchWorkspace() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [presetId, setPresetId] = useState("natural");
  const [scope, setScope] = useState("preset");
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const cancel = useRef(false);
  const activeRender = useRef<AbortController | null>(null);
  const latest = useRef(items);
  const writes = useRef(Promise.resolve());
  const mounted = useRef(true);
  const update = (rows: BatchItem[]) => {
    latest.current = rows; if (mounted.current) setItems(rows);
    writes.current = writes.current.catch(() => {}).then(() => putRecord("batch:queue", rows)).catch(() => { if (mounted.current) setMessage("Queue could not be saved. Download completed images before leaving."); });
  };
  useEffect(() => {
    mounted.current = true;
    getRecord<BatchItem[]>("batch:queue").then((rows) => { if (!mounted.current) return; const restored = (rows ?? []).map((r) => r.status === "processing" ? { ...r, status: "waiting" as const } : r); latest.current = restored; setItems(restored); setReady(true); }).catch(() => { if (mounted.current) { setReady(true); setMessage("Could not restore the batch queue"); } });
    return () => { mounted.current = false; cancel.current = true; activeRender.current?.abort(); };
  }, []);
  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    const valid = files.filter((f) => isSupportedImage(f) && f.size <= 30*1048576);
    if (latest.current.reduce((n,r) => n+r.file.size,0) + valid.reduce((n,f) => n+f.size,0) > 200*1048576 || latest.current.length + valid.length > 50) { setMessage("Queue limit: 50 images / 200 MB. Download and clear completed work first."); return; }
    update([...latest.current, ...valid.map((file) => ({ id: crypto.randomUUID(), file, selected: true, presetId: "shared", status: "waiting" as const }))]);
    setMessage(valid.length !== files.length ? "Some files were skipped: supported types are JPG, PNG, WebP, HEIC and HEIF up to 30 MB each." : "Images added to the saved queue"); event.target.value = "";
  }
  async function run(errorsOnly = false) {
    if (running) return; setRunning(true); cancel.current = false;
    const current = { ...useEditorStore.getState().adjustments };
    const queue = latest.current.filter((r) => r.selected && (errorsOnly ? r.status === "error" : r.status !== "complete"));
    for (const row of queue) {
      if (cancel.current) break;
      update(latest.current.map((r) => r.id === row.id ? { ...r, status: "processing", error: undefined } : r));
      const controller = new AbortController(); activeRender.current = controller;
      try {
        let recipe: Partial<Adjustments> = (PRESETS.find((p) => p.id === (row.presetId === "shared" ? presetId : row.presetId)) ?? PRESETS[0]).adjustments;
        if (scope !== "preset" && row.presetId === "shared") recipe = Object.fromEntries(Object.entries(current).filter(([key]) => scope === "all" || (scope === "light" ? light.has(key) : !light.has(key) && !["noiseReduction","sharpness","texture","grain","vignette","clarity","dehaze"].includes(key))));
        const normalized = await normalizeImage(row.file);
        const project: StoredProject = { id: row.id, name: row.file.name, imageName: normalized.name, imageType: normalized.type, imageBlob: normalized, width: 1, height: 1, createdAt: "", updatedAt: "", adjustments: { ...DEFAULT_ADJUSTMENTS, ...recipe }, geometry: DEFAULT_GEOMETRY };
        const output = await prepareExport(document.createElement("canvas"), project, { format: "image/jpeg", quality: .9, longEdge: 4000, watermark: "", watermarkOpacity: .7, background: "#ffffff" }, controller.signal);
        update(latest.current.map((r) => r.id === row.id ? { ...r, status: "complete", output } : r));
      } catch (e) { update(latest.current.map((r) => r.id === row.id ? { ...r, status: controller.signal.aborted ? "waiting" : "error", error: controller.signal.aborted ? undefined : e instanceof Error ? e.message : "Processing failed" } : r)); }
    }
    activeRender.current = null;
    if (mounted.current) { setRunning(false); setMessage(cancel.current ? "Paused. Resume remaining images when ready." : "Queue finished. Download images individually or as ZIP."); }
  }
  async function downloadZip() {
    try {
      const completed = latest.current.filter((r) => r.output && r.selected);
      const files: Record<string, Uint8Array> = {};
      for (const [i, row] of completed.entries()) files[`${i+1}-${row.file.name.replace(/\.[^.]+$/, "")}.jpg`] = new Uint8Array(await row.output!.arrayBuffer());
      const bytes = await new Promise<Uint8Array>((resolve,reject) => zip(files, { level: 0 }, (err,data) => err ? reject(err) : resolve(data)));
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/zip" }), "lumaforge-batch.zip");
    } catch { setMessage("ZIP creation failed. Download images individually."); }
  }
  const complete = items.filter((r) => r.status === "complete").length;
  return <AppShell><main className="batch-page"><header className="project-heading"><div><span className="kicker"> <T text={"Saved local queue"} /> </span><h1> <T text={"Batch Edit"} /> </h1><p> <T text={"Pause, resume, retry and choose per-image looks. Completed files stay on this device until removed."} /> </p></div><label className="button primary"><FileImage size={16} /> <T text={"Add images"} /> <input hidden multiple type="file" accept={IMAGE_ACCEPT} disabled={!ready || running} onChange={addFiles} /></label></header><section className="batch-controls"><label> <T text={"Shared look"} /> <select disabled={running} value={presetId} onChange={(e) => setPresetId(e.target.value)}>{PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label> <T text={"Apply"} /> <select value={scope} disabled={running} onChange={(e) => setScope(e.target.value)}><option value="preset">Selected preset</option><option value="all">Current editor adjustments</option><option value="light">Current light only</option><option value="color">Current color only</option></select></label><button className="button primary" disabled={!ready || running || !items.some((r) => r.selected && r.status !== "complete")} onClick={() => void run()}><Play size={15} /> <T text={"Process / Resume"} /> </button><button className="button" disabled={!running} onClick={() => { cancel.current = true; }}><CirclePause size={15} /> <T text={"Pause after current"} /> </button><button className="button" disabled={running || !items.some((r) => r.status === "error")} onClick={() => void run(true)}> <T text={"Retry errors"} /> </button><button className="button" disabled={running || !complete} onClick={() => void downloadZip()}><Download size={15} /> <T text={"Download ZIP"} /> </button><output>{complete}/{items.length} <T text={"complete"} /> </output></section><p role="status"><T text={message} /></p><div className="batch-list">{items.map((row) => <article className="batch-row" key={row.id}><input type="checkbox" aria-label={`Include ${row.file.name}`} disabled={running} checked={row.selected} onChange={(e) => update(latest.current.map((r) => r.id === row.id ? { ...r, selected: e.target.checked } : r))} /><div><strong>{row.file.name}</strong><small>{row.status} · {(row.file.size/1048576).toFixed(1)} MB</small>{row.error && <small role="alert">{row.error}</small>}</div><select aria-label={`Look for ${row.file.name}`} disabled={running} value={row.presetId} onChange={(e) => update(latest.current.map((r) => r.id === row.id ? { ...r, presetId: e.target.value, status: "waiting", output: undefined } : r))}><option value="shared">Shared settings</option>{PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{row.output && <button title="Download image" onClick={() => downloadBlob(row.output!, `${row.file.name.replace(/\.[^.]+$/, "")}-edited.jpg`)}><Download size={15} /></button>}<button disabled={running} aria-label={`Remove ${row.file.name}`} onClick={() => update(latest.current.filter((r) => r.id !== row.id))}><Trash2 size={15} /></button></article>)}</div>{!items.length && <div className="empty-state"><FileImage /><h2> <T text={"No images queued"} /> </h2><p> <T text={"Add images to start a recoverable batch."} /> </p></div>}</main></AppShell>;
}
