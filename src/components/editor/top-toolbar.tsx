"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Check,
  Columns2,
  Download,
  Eye,
  History,
  Redo2,
  Save,
  Share2,
  Undo2,
  UserRound,
} from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import { useStudioStore, type CompareMode } from "@/features/studio/store";

const compareCycle: CompareMode[] = ["vertical", "horizontal", "blink", "grid", "off"];

export function EditorTopToolbar({
  projectName,
  onProjectNameChange,
  syncState,
  onSave,
  onExport,
  onOpenVersions,
  onNotice,
}: {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  syncState: "local" | "saving" | "saved" | "error";
  onSave: () => void;
  onExport: () => void;
  onOpenVersions: () => void;
  onNotice: (message: string) => void;
}) {
  const past = useEditorStore((state) => state.past);
  const future = useEditorStore((state) => state.future);
  const image = useEditorStore((state) => state.image);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const toggleOriginal = useEditorStore((state) => state.toggleOriginal);
  const compareMode = useStudioStore((state) => state.compareMode);
  const setCompareMode = useStudioStore((state) => state.setCompareMode);

  async function shareProject() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: projectName, text: "LumaForge edit", url });
        onNotice("Share sheet opened");
      } else {
        await navigator.clipboard.writeText(url);
        onNotice("Project link copied");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      onNotice("Unable to share this project");
    }
  }

  function cycleCompare() {
    const index = compareCycle.indexOf(compareMode);
    const next = compareCycle[(index + 1) % compareCycle.length];
    setCompareMode(next);
    onNotice(`Compare mode: ${next}`);
  }

  return (
    <header className="professional-topbar">
      <div className="topbar-project-group">
        <Link href="/projects" className="toolbar-icon" title="Back to Projects" aria-label="Back to Projects">
          <ArrowLeft size={16} />
        </Link>
        <div className="project-title-stack">
          <span className="project-context">Projects / Editor</span>
          <input
            className="project-title-input"
            aria-label="Project title"
            value={projectName}
            maxLength={80}
            onChange={(event) => onProjectNameChange(event.target.value)}
            onBlur={() => {
              if (!projectName.trim()) onProjectNameChange("Untitled edit");
            }}
          />
        </div>
        <span className={`save-state ${syncState}`}>
          {syncState === "saving" ? "Saving…" : syncState === "error" ? "Save failed" : syncState === "saved" ? "Saved locally" : "Local draft"}
        </span>
      </div>

      <div className="topbar-actions" role="toolbar" aria-label="Editor actions">
        <div className="toolbar-cluster">
          <button className="toolbar-icon" onClick={undo} disabled={!past.length} title="Undo (Ctrl/Cmd+Z)" aria-label="Undo">
            <Undo2 size={16} />
          </button>
          <button className="toolbar-icon" onClick={redo} disabled={!future.length} title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo">
            <Redo2 size={16} />
          </button>
          <button className="toolbar-icon" onClick={onOpenVersions} title="Version history" aria-label="Version history">
            <History size={16} />
          </button>
        </div>

        <div className="toolbar-cluster toolbar-text-actions">
          <button className="toolbar-button" onClick={cycleCompare} disabled={!image} title="Cycle comparison layouts">
            <Columns2 size={15} /> <span>Compare</span><small>{compareMode}</small>
          </button>
          <button
            className="toolbar-button"
            disabled={!image}
            onPointerDown={() => toggleOriginal(true)}
            onPointerUp={() => toggleOriginal(false)}
            onPointerLeave={() => toggleOriginal(false)}
            title="Press and hold to preview original"
          >
            <Eye size={15} /> <span>Preview</span>
          </button>
          <button className="toolbar-button" onClick={() => void shareProject()} disabled={!image}>
            <Share2 size={15} /> <span>Share</span>
          </button>
        </div>

        <div className="toolbar-cluster">
          <button className="toolbar-icon" onClick={onSave} disabled={!image || syncState === "saving"} title="Save project" aria-label="Save project">
            {syncState === "saved" ? <Check size={16} /> : <Save size={16} />}
          </button>
          <button className="export-primary" onClick={onExport} disabled={!image}>
            <Download size={16} /> Export
          </button>
          <button className="toolbar-icon" title="No unread notifications" aria-label="Notifications">
            <Bell size={16} />
          </button>
          <Link href="/auth" className="toolbar-avatar" title="Profile" aria-label="Profile">
            <UserRound size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
