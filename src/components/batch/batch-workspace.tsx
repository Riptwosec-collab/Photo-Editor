"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { CirclePause, Download, FileImage, LoaderCircle, Play, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY, PRESETS } from "@/features/editor/defaults";
import { renderToCanvas } from "@/features/editor/image-processing";

type BatchStatus = "waiting" | "processing" | "complete" | "error";
type BatchItem = { id: string; file: File; status: BatchStatus; error?: string };
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export function BatchWorkspace() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [presetId, setPresetId] = useState("natural");
  const [running, setRunning] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const cancelRef = useRef(false);
  const preset = useMemo(() => PRESETS.find((candidate) => candidate.id === presetId) ?? PRESETS[0], [presetId]);

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const accepted = files
      .filter((file) => allowed.has(file.type) && file.size <= 30 * 1024 * 1024)
      .map((file) => ({ id: crypto.randomUUID(), file, status: "waiting" as const }));
    setItems((current) => [...current, ...accepted]);
    event.target.value = "";
  }

  async function renderItem(item: BatchItem) {
    const objectUrl = URL.createObjectURL(item.file);
    try {
      const source = new Image();
      source.src = objectUrl;
      await source.decode();
      const canvas = document.createElement("canvas");
      renderToCanvas(
        source,
        source.naturalWidth,
        source.naturalHeight,
        canvas,
        { ...DEFAULT_ADJUSTMENTS, ...preset.adjustments },
        DEFAULT_GEOMETRY,
        4000,
      );
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Browser encoder unavailable");
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${item.file.name.replace(/\.[^.]+$/, "")}-${preset.id}.jpg`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2500);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function processBatch() {
    if (!items.length || running) return;
    setRunning(true);
    setCancelRequested(false);
    cancelRef.current = false;
    for (const item of items.filter((candidate) => candidate.status !== "complete")) {
      if (cancelRef.current) break;
      setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: "processing", error: undefined } : candidate));
      try {
        await renderItem(item);
        setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: "complete" } : candidate));
      } catch (error) {
        setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: "error", error: error instanceof Error ? error.message : "Processing failed" } : candidate));
      }
    }
    setRunning(false);
  }

  const completed = items.filter((item) => item.status === "complete").length;

  return (
    <AppShell>
      <main className="batch-page">
        <header className="project-heading">
          <div><span className="kicker">Actual local processing queue</span><h1>Batch Edit</h1><p>Apply one verified preset across multiple browser-supported images. Status changes reflect real decode, render and export results.</p></div>
          <label className="button primary"><FileImage size={17} /> Add images<input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={addFiles} /></label>
        </header>

        <section className="batch-controls">
          <label>Preset<select value={presetId} onChange={(event) => setPresetId(event.target.value)}>{PRESETS.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
          <div><button className="button primary" disabled={!items.length || running} onClick={() => void processBatch()}>{running ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />} Process & download</button><button className="button" disabled={!running} onClick={() => { setCancelRequested(true); cancelRef.current = true; }}><CirclePause size={16} /> Stop after current</button></div>
        <output className="batch-summary">{completed}/{items.length} complete{cancelRequested ? " · stop requested" : ""}</output></section>

        {!items.length && <div className="empty-state"><FileImage /><h2>No images queued</h2><p>Supported in this MVP: JPG, PNG and WebP up to 30 MB each.</p></div>}

        <div className="batch-list">
          {items.map((item) => (
            <article key={item.id} className="batch-row">
              <FileImage size={20} />
              <div><strong>{item.file.name}</strong><small>{(item.file.size / 1024 / 1024).toFixed(2)} MB · {item.file.type}</small>{item.error && <span className="error-text">{item.error}</span>}</div>
              <span className={`queue-status ${item.status}`}>{item.status}</span>
              {item.status === "complete" ? <Download size={16} /> : <button className="icon-button" disabled={running} title="Remove" onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))}><Trash2 size={15} /></button>}
            </article>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
