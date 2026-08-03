"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Redo2, Save, Undo2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdjustmentPanel } from "./adjustment-panel";
import { AiPanel } from "./ai-panel";
import { CanvasStage } from "./canvas-stage";
import { GeometryPanel } from "./geometry-panel";
import { ImportZone } from "./import-zone";
import { PresetStrip } from "./preset-strip";
import { useEditorStore } from "@/features/editor/store";
import { renderToCanvas } from "@/features/editor/image-processing";
import { getProject, saveProject } from "@/lib/idb";

export function EditorWorkspace({ initialProjectId }: { initialProjectId?: string }) {
  const image = useEditorStore((state) => state.image);
  const currentProjectId = useEditorStore((state) => state.currentProjectId);
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);
  const setImage = useEditorStore((state) => state.setImage);
  const setCurrentProjectId = useEditorStore((state) => state.setCurrentProjectId);
  const loadRecipe = useEditorStore((state) => state.loadRecipe);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const past = useEditorStore((state) => state.past);
  const future = useEditorStore((state) => state.future);
  const toggleOriginal = useEditorStore((state) => state.toggleOriginal);
  const showOriginal = useEditorStore((state) => state.showOriginal);
  const [tab, setTab] = useState<"adjust" | "geometry" | "ai">("adjust");
  const [notice, setNotice] = useState("");
  const [loadingProject, setLoadingProject] = useState(Boolean(initialProjectId));
  const loadedObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!initialProjectId) return;
    let cancelled = false;
    void getProject(initialProjectId)
      .then((project) => {
        if (cancelled) return;
        if (!project) throw new Error("Saved project was not found on this device");
        const objectUrl = URL.createObjectURL(project.imageBlob);
        loadedObjectUrl.current = objectUrl;
        setImage({
          name: project.imageName,
          type: project.imageType,
          size: project.imageBlob.size,
          width: project.width,
          height: project.height,
          objectUrl,
        });
        setCurrentProjectId(project.id);
        loadRecipe(project.adjustments, project.geometry);
        setNotice(`Opened ${project.name}`);
      })
      .catch((error: unknown) => {
        setNotice(error instanceof Error ? error.message : "Unable to open project");
      })
      .finally(() => setLoadingProject(false));
    return () => {
      cancelled = true;
      if (loadedObjectUrl.current) URL.revokeObjectURL(loadedObjectUrl.current);
    };
  }, [initialProjectId, loadRecipe, setCurrentProjectId, setImage]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (event.key === "\\") toggleOriginal();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [redo, toggleOriginal, undo]);

  async function persistProject() {
    if (!image) return;
    setNotice("Saving project to this device…");
    try {
      const imageBlob = await fetch(image.objectUrl).then((response) => response.blob());
      const existing = currentProjectId ? await getProject(currentProjectId) : undefined;
      const now = new Date().toISOString();
      const id = existing?.id ?? crypto.randomUUID();
      await saveProject({
        id,
        name: existing?.name ?? image.name.replace(/\.[^.]+$/, ""),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        imageBlob,
        imageName: image.name,
        imageType: image.type,
        width: image.width,
        height: image.height,
        adjustments,
        geometry,
        archivedAt: existing?.archivedAt,
      });
      setCurrentProjectId(id);
      setNotice("Project saved locally with image and edit recipe");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Project save failed");
    }
  }

  async function exportImage(type: "image/png" | "image/jpeg") {
    if (!image) return;
    setNotice("Rendering full export…");
    try {
      const source = new Image();
      source.src = image.objectUrl;
      await source.decode();
      const canvas = document.createElement("canvas");
      renderToCanvas(
        source,
        source.naturalWidth,
        source.naturalHeight,
        canvas,
        adjustments,
        geometry,
        6000,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, type === "image/jpeg" ? 0.92 : undefined),
      );
      if (!blob) throw new Error("Export encoder unavailable");
      const link = document.createElement("a");
      const downloadUrl = URL.createObjectURL(blob);
      link.href = downloadUrl;
      link.download = `${image.name.replace(/\.[^.]+$/, "")}-lumaforge.${type === "image/png" ? "png" : "jpg"}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
      setNotice("Export complete");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export failed");
    }
  }

  return (
    <AppShell>
      <header className="editor-topbar">
        <div>
          <span className="kicker">{currentProjectId ? "Saved project" : "Local draft"}</span>
          <strong>{image?.name ?? "Untitled edit"}</strong>
        </div>
        <div className="top-actions">
          <button className="icon-button" onClick={undo} disabled={!past.length} title="Undo"><Undo2 /></button>
          <button className="icon-button" onClick={redo} disabled={!future.length} title="Redo"><Redo2 /></button>
          <button
            className={showOriginal ? "button active" : "button"}
            onPointerDown={() => toggleOriginal(true)}
            onPointerUp={() => toggleOriginal(false)}
            onPointerLeave={() => toggleOriginal(false)}
          >
            Hold original
          </button>
          <button className="button" disabled={!image} onClick={() => void persistProject()}>
            <Save size={16} /> Save project
          </button>
          <button className="icon-button" disabled={!image} onClick={() => void exportImage("image/png")} title="Export PNG">
            <Download size={17} />
          </button>
          <button className="button primary" disabled={!image} onClick={() => void exportImage("image/jpeg")}>
            <Download size={16} /> Export JPG
          </button>
        </div>
      </header>
      {notice && <div className="toast" role="status">{notice}</div>}
      <div className="editor-grid">
        <main className="editor-main">
          {loadingProject ? <div className="import-wrap"><div className="loading-card">Opening saved project…</div></div> : image ? <CanvasStage /> : <ImportZone />}
          {image && <PresetStrip />}
        </main>
        <aside className="right-panel">
          <div className="panel-tabs three-tabs">
            <button className={tab === "adjust" ? "active" : ""} onClick={() => setTab("adjust")}>Adjust</button>
            <button className={tab === "geometry" ? "active" : ""} onClick={() => setTab("geometry")}>Crop</button>
            <button className={tab === "ai" ? "active" : ""} onClick={() => setTab("ai")}>AI Plan</button>
          </div>
          {tab === "adjust" ? <AdjustmentPanel /> : tab === "geometry" ? <GeometryPanel /> : <AiPanel />}
        </aside>
      </div>
    </AppShell>
  );
}
