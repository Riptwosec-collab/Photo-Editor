"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileImage, History, LoaderCircle, RefreshCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "@/features/editor/defaults";
import { renderToCanvas } from "@/features/editor/image-processing";
import type { AspectRatio, ExportFormat, ExportRecord, StoredProject } from "@/features/editor/types";
import { listExportRecords, listProjects, saveExportRecord } from "@/lib/idb";

type ExportPreset = {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  quality: number;
  longEdge: number;
  aspectRatio?: AspectRatio;
};

const presets: ExportPreset[] = [
  { id: "instagram-feed", name: "Instagram Feed", description: "JPG · sRGB · 4:5 · 1350 px long edge", format: "image/jpeg", quality: 0.9, longEdge: 1350, aspectRatio: "4:5" },
  { id: "web", name: "Web", description: "WebP · sRGB · 2048 px long edge", format: "image/webp", quality: 0.86, longEdge: 2048 },
  { id: "high-quality", name: "High Quality", description: "JPG · sRGB · up to 6000 px", format: "image/jpeg", quality: 0.95, longEdge: 6000 },
  { id: "transparent", name: "PNG", description: "PNG · sRGB · lossless browser export", format: "image/png", quality: 1, longEdge: 6000 },
];

function extensionFor(format: ExportFormat) {
  if (format === "image/png") return "png";
  if (format === "image/webp") return "webp";
  return "jpg";
}

function normalizeProject(project: StoredProject): StoredProject {
  return {
    ...project,
    adjustments: { ...DEFAULT_ADJUSTMENTS, ...project.adjustments },
    geometry: { ...DEFAULT_GEOMETRY, ...project.geometry },
  };
}

function ExportPreview({ project, longEdge, aspectRatio }: { project: StoredProject; longEdge: number; aspectRatio?: AspectRatio }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(project.imageBlob);
    const source = new window.Image();
    source.onload = () => {
      if (!canvasRef.current) return;
      renderToCanvas(
        source,
        source.naturalWidth,
        source.naturalHeight,
        canvasRef.current,
        project.adjustments,
        { ...project.geometry, aspectRatio: aspectRatio ?? project.geometry.aspectRatio },
        Math.min(longEdge, 900),
      );
    };
    source.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [aspectRatio, longEdge, project]);

  return <canvas ref={canvasRef} aria-label="Export preview" />;
}

export function ExportCenter() {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [presetId, setPresetId] = useState("instagram-feed");
  const [format, setFormat] = useState<ExportFormat>("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const [longEdge, setLongEdge] = useState(1350);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | undefined>("4:5");
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [status, setStatus] = useState("Loading saved projects…");
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const rows = (await listProjects()).map(normalizeProject);
      setProjects(rows);
      setProjectId((current) => current || rows[0]?.id || "");
      setHistory(await listExportRecords());
      setStatus(rows.length ? "" : "Save a project before using Export Center.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load export data");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projectId, projects],
  );

  function applyPreset(id: string) {
    const preset = presets.find((candidate) => candidate.id === id);
    if (!preset) return;
    setPresetId(id);
    setFormat(preset.format);
    setQuality(preset.quality);
    setLongEdge(preset.longEdge);
    setAspectRatio(preset.aspectRatio);
  }

  async function exportProject() {
    if (!selectedProject || exporting) return;
    setExporting(true);
    setStatus("Rendering export…");
    const objectUrl = URL.createObjectURL(selectedProject.imageBlob);
    try {
      const source = new window.Image();
      source.src = objectUrl;
      await source.decode();
      const canvas = document.createElement("canvas");
      const result = renderToCanvas(
        source,
        source.naturalWidth,
        source.naturalHeight,
        canvas,
        selectedProject.adjustments,
        { ...selectedProject.geometry, aspectRatio: aspectRatio ?? selectedProject.geometry.aspectRatio },
        longEdge,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format, format === "image/png" ? undefined : quality),
      );
      if (!blob) throw new Error(`${format} export is not supported by this browser`);
      const filename = `${selectedProject.name.replace(/[^a-z0-9-_]+/gi, "-")}-${presetId}.${extensionFor(format)}`;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2500);
      await saveExportRecord({
        id: crypto.randomUUID(),
        projectId: selectedProject.id,
        createdAt: new Date().toISOString(),
        format,
        quality,
        longEdge,
        width: result.width,
        height: result.height,
        filename,
        colorSpace: "sRGB",
      });
      setHistory(await listExportRecords());
      setStatus(`Exported ${filename} (${result.width} × ${result.height})`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Export failed");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setExporting(false);
    }
  }

  return (
    <AppShell>
      <main className="export-page">
        <header className="project-heading">
          <div>
            <span className="kicker">Same renderer as editor preview</span>
            <h1>Export Center</h1>
            <p>Exports use the saved project recipe, crop, tone curve, sharpness and denoise. Browser Canvas output is tagged operationally as sRGB; embedded ICC and EXIF metadata are not preserved in this MVP.</p>
          </div>
          <button className="button" onClick={() => void refresh()}><RefreshCcw size={16} /> Refresh</button>
        </header>

        <section className="export-layout">
          <div className="export-preview-card">
            {selectedProject ? (
              <>
                <ExportPreview project={selectedProject} longEdge={longEdge} aspectRatio={aspectRatio} />
                <div><strong>{selectedProject.name}</strong><small>{selectedProject.width} × {selectedProject.height} source</small></div>
              </>
            ) : (
              <div className="empty-state"><FileImage /><h2>No saved project</h2><p>Save an image from the editor first.</p></div>
            )}
          </div>

          <div className="export-settings">
            <label>Project<select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            <div className="export-presets">{presets.map((preset) => <button key={preset.id} className={presetId === preset.id ? "export-preset active" : "export-preset"} onClick={() => applyPreset(preset.id)}><strong>{preset.name}</strong><small>{preset.description}</small></button>)}</div>
            <label>Format<select value={format} onChange={(event) => { setPresetId("custom"); setFormat(event.target.value as ExportFormat); }}><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>
            <label>Quality <output>{Math.round(quality * 100)}%</output><input type="range" min="0.5" max="1" step="0.01" value={quality} disabled={format === "image/png"} onChange={(event) => { setPresetId("custom"); setQuality(Number(event.target.value)); }} /></label>
            <label>Long edge <output>{longEdge}px</output><input type="range" min="640" max="6000" step="10" value={longEdge} onChange={(event) => { setPresetId("custom"); setLongEdge(Number(event.target.value)); }} /></label>
            <label>Export crop<select value={aspectRatio ?? "project"} onChange={(event) => { setPresetId("custom"); setAspectRatio(event.target.value === "project" ? undefined : event.target.value as AspectRatio); }}><option value="project">Project crop</option><option value="original">Original ratio</option><option value="1:1">1:1</option><option value="4:5">4:5</option><option value="16:9">16:9</option></select></label>
            <div className="export-disclosure"><strong>Color: sRGB</strong><span>Metadata: stripped · Watermark: not implemented · Unsupported encoders show an error</span></div>
            <button className="button primary export-button" disabled={!selectedProject || exporting} onClick={() => void exportProject()}>{exporting ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />} Export and download</button>
            {status && <p role="status" className="export-status">{status}</p>}
          </div>
        </section>

        <section className="export-history">
          <div className="section-heading"><History /><div><h2>Export history</h2><p>Records successful browser exports only.</p></div></div>
          <div className="export-history-list">{history.slice(0, 20).map((record) => <article key={record.id}><div><strong>{record.filename}</strong><small>{new Date(record.createdAt).toLocaleString()}</small></div><span>{record.width} × {record.height}</span><span>{record.format.replace("image/", "").toUpperCase()} · {record.colorSpace}</span></article>)}</div>
          {!history.length && <div className="mini-empty">No successful exports recorded.</div>}
        </section>
      </main>
    </AppShell>
  );
}
