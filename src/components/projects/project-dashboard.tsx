"use client";
import { T, useT } from "@/features/i18n/text";


import { RecipeThumbnail } from "../editor/recipe-thumbnail";
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
  deleteProject, setProjectTrashed, organizeProject, findDuplicateProjects,
  duplicateProject,
  listProjects,
  renameProject,
  setProjectArchived,
} from "@/lib/idb";

type ProjectWithPreview = StoredProject & { previewUrl: string };

export function ProjectDashboard({ mode = "projects" }: { mode?: "projects" | "gallery" }) {
  const t = useT();
  const [showTrash,setShowTrash]=useState(false);
  const [album,setAlbum]=useState("");
  const [duplicates,setDuplicates]=useState<string[]>([]);
  const [scanning,setScanning]=useState(false);
  const [onlyDuplicates,setOnlyDuplicates]=useState(false);
  const [projects, setProjects] = useState<ProjectWithPreview[]>([]);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [status, setStatus] = useState("Loading local projects…");
  const urls = useRef<string[]>([]);

  const refresh = useCallback(async () => {
    setStatus("Loading local projects…");
    try {
      const rows = await listProjects({ includeArchived: showArchived || showTrash, includeTrashed: true });
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      const next = rows.filter(p=>showTrash?Boolean(p.trashedAt):!p.trashedAt).map((project) => {
        const previewUrl = URL.createObjectURL(project.imageBlob);
        urls.current.push(previewUrl);
        return { ...project, previewUrl };
      });
      setProjects(next);
      setStatus(next.length ? "" : "No projects saved on this device yet.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to read local projects");
    }
  }, [showArchived,showTrash]);

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
    return projects.filter(project=>(!album || project.album===album) && (!onlyDuplicates || duplicates.includes(project.id)) &&
      [project.name,project.imageName,project.imageType,project.album??"",...(project.tags??[])].some(value=>value.toLowerCase().includes(normalized)));
  }, [projects, query,album,onlyDuplicates,duplicates]);

  async function handleRename(project: StoredProject) {
    const next = window.prompt(t("Rename project"), project.name)?.trim();
    if (!next || next === project.name) return;
    try {
      await renameProject(project.id, next);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Rename failed");
    }
  }

  async function handleDelete(project: StoredProject) {

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
            <span className="kicker"><T text="Image library"/></span>
            <h1><T text={showTrash?"Trash":mode === "gallery" ? "Gallery" : "Projects"}/></h1>
            <p>
              <T text="Organize local projects into albums and tags. Use Cloud to sync; trashed projects remain recoverable."/>
            </p>
          </div>
          <Link className="button primary" href="/editor"><ImagePlus size={17} /> <T text={"New edit"} /> </Link>
        </header>

        <div className="project-toolbar">
          <label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search names, albums and tags")} aria-label={t("Search names, albums and tags")} /></label>
          <label className="archive-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> <T text={"Include archived"} /> </label>
          <label className="archive-toggle"><input type="checkbox" checked={showTrash} onChange={e=>setShowTrash(e.target.checked)}/><T text="Trash"/></label>
          <select aria-label={t("Album")} value={album} onChange={e=>setAlbum(e.target.value)}><option value="">{t("All albums")}</option>{[...new Set(projects.map(p=>p.album).filter(Boolean))].map(a=><option key={a}>{a}</option>)}</select>
          <button className="button" disabled={scanning||!projects.length} onClick={async()=>{setScanning(true);try{setDuplicates(await findDuplicateProjects(projects));setOnlyDuplicates(true);}catch{setStatus("Duplicate scan failed");}finally{setScanning(false);}}}><T text={scanning?"Scanning…":"Find exact duplicates"}/></button>
          {onlyDuplicates && <button className="button" onClick={()=>setOnlyDuplicates(false)}><T text="Show all images"/> ({duplicates.length})</button>}
        </div>

        {status && <div className="empty-state"><FolderOpen /><h2><T text={status}/></h2><p><T text="Open the editor, import a supported image and choose Save project."/></p><Link className="button primary" href="/editor"> <T text={"Open editor"} /> </Link></div>}

        {!status && !filtered.length && <p role="status"><T text="No matching images"/></p>}
        <section className={mode === "gallery" ? "project-grid gallery-grid" : "project-grid"}>
          {filtered.map((project) => (
            <article className="project-card" key={project.id}>
              <Link className="project-preview" href={`/editor?project=${project.id}`}>
                <RecipeThumbnail url={project.previewUrl} adjustments={project.adjustments} geometry={project.geometry} layers={project.layers} />
                {project.archivedAt && <span className="archived-badge"> <T text={"Archived"} /> </span>}
              </Link>
              <div className="project-card-body">
                <div><h2>{project.name}</h2><p>{project.width} × {project.height} · {new Date(project.updatedAt).toLocaleString()}</p></div>
                <div className="project-tags">{project.album&&<span>{project.album}</span>}{project.tags?.map(tag=><span key={tag}>#{tag}</span>)}</div>
                {duplicates.includes(project.id)&&<small className="duplicate-badge"><T text="Identical source image"/></small>}
                <div className="project-actions">
                  <button className="button" onClick={async()=>{const nextAlbum=window.prompt(t("Album"),project.album??"");if(nextAlbum===null)return;const tags=window.prompt(t("Tags separated by commas"),project.tags?.join(", ")??"");if(tags===null)return;try{await organizeProject(project.id,nextAlbum,tags.split(","));await refresh();}catch{setStatus("Could not organize project");}}}><T text="Organize"/></button>
                  {project.trashedAt && <button className="button" onClick={()=>void setProjectTrashed(project.id,false).then(refresh).catch(()=>setStatus("Restore failed"))}><T text="Restore from trash"/></button>}
                  <Link className="icon-button" href={`/editor?project=${project.id}`} title="Open project"><FolderOpen size={16} /></Link>
                  <button className="icon-button" title="Rename" onClick={() => void handleRename(project)}><Pencil size={15} /></button>
                  <button className="icon-button" title="Duplicate" onClick={() => void duplicateProject(project.id).then(refresh).catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Duplicate failed"))}><Copy size={15} /></button>
                  <button className="icon-button" title={project.archivedAt ? "Restore" : "Archive"} onClick={() => void setProjectArchived(project.id, !project.archivedAt).then(refresh).catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Archive action failed"))}>{project.archivedAt ? <Undo2 size={15} /> : <Archive size={15} />}</button>
                  {!project.trashedAt && <button className="icon-button danger-button" title={t("Move to trash")} onClick={() => void handleDelete(project)}><Trash2 size={15} /></button>}
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
