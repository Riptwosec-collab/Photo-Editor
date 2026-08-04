"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Film } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { CanvasStage } from "./canvas-stage";
import { EditorTopToolbar } from "./top-toolbar";
import { Filmstrip } from "./filmstrip";
import { ImportZone } from "./import-zone";
import { PresetStrip } from "./preset-strip";
import { ProInspector } from "./pro-inspector";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "@/features/editor/defaults";
import { useEditorStore } from "@/features/editor/store";
import { useStudioStore } from "@/features/studio/store";
import { getProject, saveProject } from "@/lib/idb";
import { cn } from "@/lib/cn";

export function EditorWorkspace({ initialProjectId }: { initialProjectId?: string }) {
  const router = useRouter();
  const image = useEditorStore((state) => state.image);
  const currentProjectId = useEditorStore((state) => state.currentProjectId);
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);
  const setImage = useEditorStore((state) => state.setImage);
  const setCurrentProjectId = useEditorStore((state) => state.setCurrentProjectId);
  const loadRecipe = useEditorStore((state) => state.loadRecipe);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const toggleOriginal = useEditorStore((state) => state.toggleOriginal);
  const assistantCollapsed = useStudioStore((state) => state.assistantCollapsed);
  const inspectorCollapsed = useStudioStore((state) => state.inspectorCollapsed);
  const filmstripCollapsed = useStudioStore((state) => state.filmstripCollapsed);
  const setAssistantCollapsed = useStudioStore((state) => state.setAssistantCollapsed);
  const setFilmstripCollapsed = useStudioStore((state) => state.setFilmstripCollapsed);
  const setInspectorCollapsed = useStudioStore((state) => state.setInspectorCollapsed);
  const setActiveInspectorSection = useStudioStore((state) => state.setActiveInspectorSection);
  const [projectName, setProjectName] = useState("Untitled edit");
  const [notice, setNotice] = useState("");
  const [syncState, setSyncState] = useState<"local" | "saving" | "saved" | "error">("local");
  const [loadingProject, setLoadingProject] = useState(Boolean(initialProjectId));
  const loadedObjectUrl = useRef<string | null>(null);
  const lastImportedName = useRef<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3200);
  }, []);

  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
  }, []);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 680px)");
    const applyCanvasFirstDefaults = () => {
      if (!mobile.matches) return;
      setAssistantCollapsed(true);
      setInspectorCollapsed(true);
    };
    applyCanvasFirstDefaults();
    mobile.addEventListener("change", applyCanvasFirstDefaults);
    return () => mobile.removeEventListener("change", applyCanvasFirstDefaults);
  }, [setAssistantCollapsed, setInspectorCollapsed]);

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
        setProjectName(project.name);
        setCurrentProjectId(project.id);
        loadRecipe(
          { ...DEFAULT_ADJUSTMENTS, ...project.adjustments },
          { ...DEFAULT_GEOMETRY, ...project.geometry },
        );
        setSyncState("saved");
        showNotice(`Opened ${project.name}`);
      })
      .catch((error: unknown) => {
        showNotice(error instanceof Error ? error.message : "Unable to open project");
        setSyncState("error");
      })
      .finally(() => setLoadingProject(false));
    return () => {
      cancelled = true;
      if (loadedObjectUrl.current) URL.revokeObjectURL(loadedObjectUrl.current);
    };
  }, [initialProjectId, loadRecipe, setCurrentProjectId, setImage, showNotice]);

  useEffect(() => {
    if (!image || image.name === lastImportedName.current) return;
    lastImportedName.current = image.name;
    if (!initialProjectId && projectName === "Untitled edit") {
      const timer = window.setTimeout(() => {
        setProjectName(image.name.replace(/\.[^.]+$/, "") || "Untitled edit");
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [image, initialProjectId, projectName]);

  const persistProject = useCallback(
    async (silent = false) => {
      if (!image) return null;
      setSyncState("saving");
      if (!silent) showNotice("Saving project to this device…");
      try {
        const imageBlob = await fetch(image.objectUrl).then((response) => response.blob());
        const existing = currentProjectId ? await getProject(currentProjectId) : undefined;
        const now = new Date().toISOString();
        const id = existing?.id ?? crypto.randomUUID();
        await saveProject({
          id,
          name: projectName.trim() || image.name.replace(/\.[^.]+$/, "") || "Untitled edit",
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
        setSyncState("saved");
        if (!silent) showNotice("Project saved locally with image and non-destructive recipe");
        return id;
      } catch (error) {
        setSyncState("error");
        showNotice(error instanceof Error ? error.message : "Project save failed");
        return null;
      }
    },
    [adjustments, currentProjectId, geometry, image, projectName, setCurrentProjectId, showNotice],
  );

  useEffect(() => {
    if (!image || !currentProjectId || loadingProject) return;
    const timer = window.setTimeout(() => void persistProject(true), 1400);
    return () => window.clearTimeout(timer);
  }, [adjustments, currentProjectId, geometry, image, loadingProject, persistProject, projectName]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editingText = target?.matches("input,textarea,select,[contenteditable=true]");
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persistProject(false);
      }
      if (!editingText && event.key === "\\") toggleOriginal();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [persistProject, redo, toggleOriginal, undo]);

  async function openExportCenter() {
    if (!image) return;
    const id = await persistProject(true);
    if (!id) return;
    router.push("/export-center");
  }

  function openVersions() {
    setInspectorCollapsed(false);
    setActiveInspectorSection("versions");
    showNotice("Version History opened in the unified inspector");
  }

  return (
    <AppShell>
      <div
        className={cn(
          "professional-editor-shell",
          assistantCollapsed && "assistant-collapsed",
          inspectorCollapsed && "inspector-collapsed",
          filmstripCollapsed && "filmstrip-collapsed",
        )}
      >
        <EditorTopToolbar
          projectName={projectName}
          onProjectNameChange={(name) => {
            setProjectName(name);
            setSyncState("local");
          }}
          syncState={syncState}
          onSave={() => void persistProject(false)}
          onExport={() => void openExportCenter()}
          onOpenVersions={openVersions}
          onNotice={showNotice}
        />

        <AiAssistantPanel onNotice={showNotice} />

        <main className="professional-editor-main">
          {loadingProject ? (
            <div className="import-wrap"><div className="loading-card">Opening saved project and recipe…</div></div>
          ) : image ? (
            <>
              <CanvasStage />
              <div className="quick-preset-dock"><PresetStrip /></div>
            </>
          ) : (
            <ImportZone />
          )}
        </main>

        <ProInspector projectId={currentProjectId} onNotice={showNotice} />

        {filmstripCollapsed ? (
          <button className="filmstrip-collapsed-rail" onClick={() => setFilmstripCollapsed(false)}><Film size={15} /> Filmstrip <ChevronUp size={14} /></button>
        ) : (
          <div className="filmstrip-region">
            <button className="filmstrip-collapse-toggle" title="Collapse filmstrip" aria-label="Collapse filmstrip" onClick={() => setFilmstripCollapsed(true)}><ChevronUp size={14} /></button>
            <Filmstrip onNotice={showNotice} />
          </div>
        )}

        {notice && <div className="toast professional-toast" role="status">{notice}</div>}
      </div>
    </AppShell>
  );
}
