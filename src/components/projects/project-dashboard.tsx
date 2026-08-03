"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Copy,
  FolderOpen,
  ImagePlus,
  Pencil,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import type { StoredProject } from "@/features/editor/types";
import {
  deleteProject,
  duplicateProject,
  listProjects,
  renameProject,
  setProjectArchived,
} from "@/lib/idb";

type ProjectWithPreview = StoredProject & { previewUrl: string };

export function ProjectDashboard({ mode = "projects" }: { mode?: "projects" | "gallery" }) {
  const [projects, setProjects] = useState<ProjectWithPreview[]>([]);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [status, setStatus] = useState("Loading local projects…");
  const urls = useRef<string[]>([]);

  const refresh = useCallback(async () => {
    setStatus("Loading local projects…");
    try {
      const rows = await listProjects({ includeArchived: showArchived });
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      const next = rows.map((project) => {
        const previewUrl = URL.createObjectURL(project.imageBlob);
        urls.current.push(previewUrl);
        return { ...project, previewUrl };
      });
      setProjects(next);
      setStatus(next.length ? "" : "No projects saved on this device yet.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to read local projects");
    }
  }, [showArchived]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current = [];
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) =>
      [project.name, project.imageName, project.imageType].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [projects, query]);

  async function handleRename(project: StoredProject) {
    const next = window.prompt("Rename project", project.name)?.trim();
    if (!next || next === project.name) return;
    try {
      await renameProject(project.id, next);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Rename failed");
    }
  }

  async function handleDelete(project: StoredProject) {
    if (!window.confirm(`Delete “${project.name}” from this device?`)) return;
    try {
      await deleteProject(project.id);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <AppShell>
      <main className="project-page">
        <header className="project-heading">
          <div>
            <span className="kicker">Local-first asset management</span>
            <h1>{mode === "gallery" ? "Gallery" : "Projects"}</h1>
            <p>
              Image bytes, edit recipes and geometry are stored in IndexedDB on this browser.
              Cloud sync is not presented as active.
            </p>
          </div>
          <Link className="button primary" href="/editor"><ImagePlus size={17} /> New edit</Link>
        </header>

        <div className="project-toolbar">
          <label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" /></label>
          <label className="archive-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Include archived</label>
        </div>

        {status && <div className="empty-state"><FolderOpen /><h2>{status}</h2><p>Open the editor, import a supported image and choose Save project.</p><Link className="button primary" href="/editor">Open editor</Link></div>}

        <section className={mode === "gallery" ? "project-grid gallery-grid" : "project-grid"}>
          {filtered.map((project) => (
            <article className="project-card" key={project.id}>
              <Link className="project-preview" href={`/editor?project=${project.id}`}>
                <Image
                  src={project.previewUrl}
                  alt={`Preview of ${project.name}`}
                  width={project.width}
                  height={project.height}
                  unoptimized
                />
                {project.archivedAt && <span className="archived-badge">Archived</span>}
              </Link>
              <div className="project-card-body">
                <div><h2>{project.name}</h2><p>{project.width} × {project.height} · {new Date(project.updatedAt).toLocaleString()}</p></div>
                <div className="project-actions">
                  <Link className="icon-button" href={`/editor?project=${project.id}`} title="Open project"><FolderOpen size={16} /></Link>
                  <button className="icon-button" title="Rename" onClick={() => void handleRename(project)}><Pencil size={15} /></button>
                  <button className="icon-button" title="Duplicate" onClick={() => void duplicateProject(project.id).then(refresh).catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Duplicate failed"))}><Copy size={15} /></button>
                  <button className="icon-button" title={project.archivedAt ? "Restore" : "Archive"} onClick={() => void setProjectArchived(project.id, !project.archivedAt).then(refresh).catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Archive action failed"))}>{project.archivedAt ? <Undo2 size={15} /> : <Archive size={15} />}</button>
                  <button className="icon-button danger-button" title="Delete" onClick={() => void handleDelete(project)}><Trash2 size={15} /></button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
