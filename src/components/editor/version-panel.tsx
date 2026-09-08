"use client";
import { T, useT } from "@/features/i18n/text";


import { useCallback, useEffect, useState } from "react";
import { Camera, Copy, GitBranch, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { StoredVersion } from "@/features/editor/types";
import { RecipeThumbnail } from "./recipe-thumbnail";
import { deleteVersion, listVersions, renameVersion, saveVersion } from "@/lib/idb";

export function VersionPanel({ projectId, embedded = false }: { projectId: string | null; embedded?: boolean }) {
  const t=useT();
  const [parentId,setParentId]=useState<string>();
  const [compare,setCompare]=useState<string[]>([]);
  const [snapshotName,setSnapshotName]=useState("");
  const image = useEditorStore((s) => s.image);
  const layers = useEditorStore((s) => s.layers);
  const restoreSnapshot = useEditorStore((s) => s.restoreSnapshot);
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);
  const [versions, setVersions] = useState<StoredVersion[]>([]);
  const [status, setStatus] = useState("");

  const refresh = useCallback(async () => {
    if (!projectId) {
      setVersions([]);
      return;
    }
    try {
      setVersions(await listVersions(projectId));
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load versions");
    }
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {setParentId(undefined);setCompare([]);setSnapshotName("");void refresh();}, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function createSnapshot(name?: string) {
    if (!projectId) {
      setStatus("Save the project before creating a snapshot.");
      return;
    }
    const now = new Date();
    const version: StoredVersion = {
      id: crypto.randomUUID(),
      projectId,
      name: name ?? (snapshotName.trim() || `Snapshot ${versions.length + 1}`),
      parentVersionId:parentId,
      createdAt: now.toISOString(),
      adjustments: { ...adjustments },
      geometry: { ...geometry },
      layers: structuredClone(layers),
    };
    try {
      await saveVersion(version);
      await refresh();
      setParentId(version.id);setSnapshotName("");setStatus("Snapshot created");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Snapshot failed");
    }
  }

  async function duplicateVersion(version: StoredVersion) {
    await saveVersion({ ...version, id: crypto.randomUUID(), name: `${version.name} Copy`, createdAt: new Date().toISOString() });
    await refresh();
    setStatus("Version duplicated");
  }

  async function branchVersion(version: StoredVersion) {
    restoreSnapshot(version);setParentId(version.id);setSnapshotName(`${version.name} Branch`.slice(0,100));setStatus("Branch loaded. Edit the image, then create a snapshot to save the branch.");
  }

  async function editName(version: StoredVersion) {
    const name = window.prompt("Rename snapshot", version.name)?.trim();
    if (!name || name === version.name) return;
    try {
      await renameVersion(version.id, name);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Rename failed");
    }
  }

  async function remove(version: StoredVersion) {
    if (!window.confirm(`Delete snapshot “${version.name}”?`)) return;
    try {
      await deleteVersion(version.id);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className={embedded ? "inline-editor-panel version-panel embedded" : "panel-scroll version-panel"}>
      {!embedded && <div className="panel-title"><div><span className="kicker"> <T text={"Non-destructive"} /> </span><h2> <T text={"Snapshots"} /> </h2></div><button className="icon-button" title="Refresh snapshots" onClick={() => void refresh()}><RotateCcw size={16} /></button></div>}
      <p className="control-note">Snapshots store the edit recipe and geometry. Original image bytes are never overwritten.</p>
      <label><T text="Snapshot name"/><input maxLength={100} aria-label="Snapshot name" value={snapshotName} onChange={e=>setSnapshotName(e.target.value)}/></label>
      {parentId&&<p><T text="Branch from"/>: {versions.find(v=>v.id===parentId)?.name??t("Deleted snapshot")}</p>}
      <div className="version-primary-actions"><button className="button primary compact" disabled={!projectId} onClick={() => void createSnapshot()}><Camera size={15} /> <T text={"Create snapshot"} /> </button><button className="icon-button" title="Refresh snapshots" onClick={() => void refresh()}><RotateCcw size={14} /></button></div>
      {!projectId && <p className="version-hint"> <T text={"Save this project first to enable durable snapshots."} /> </p>}
      {status && <p role="status" className="version-status"><T text={status}/></p>}
      <div className="version-list">
        {versions.map((version) => (
          <article key={version.id} className="version-row expanded-actions">
            <button className="version-restore" onClick={() => { restoreSnapshot(version); setParentId(version.id);setStatus(`Restored ${version.name}`); }}><RecipeThumbnail url={image?.objectUrl} adjustments={version.adjustments} geometry={version.geometry} layers={version.layers} /><strong>{version.name}</strong><small>{new Date(version.createdAt).toLocaleString()}</small></button>
            {version.parentVersionId&&<small>{t("Branch from")}: {versions.find(v=>v.id===version.parentVersionId)?.name??t("Deleted snapshot")}</small>}<label><input type="checkbox" aria-label={`Compare ${version.name}`} checked={compare.includes(version.id)} disabled={!compare.includes(version.id)&&compare.length>=4} onChange={e=>setCompare(ids=>e.target.checked?[...ids,version.id]:ids.filter(id=>id!==version.id))}/><T text="Compare"/></label>
            <button className="icon-button" title="Rename snapshot" onClick={() => void editName(version)}><Pencil size={13} /></button>
            <button className="icon-button" title="Duplicate version" onClick={() => void duplicateVersion(version)}><Copy size={13} /></button>
            <button className="icon-button" title="Branch version" onClick={() => void branchVersion(version)}><GitBranch size={13} /></button>
            <button className="icon-button danger-button" title="Delete snapshot" onClick={() => void remove(version)}><Trash2 size={13} /></button>
          </article>
        ))}
      </div>
      {compare.length>0&&<section className="version-comparison" aria-label="Version comparison">{versions.filter(v=>compare.includes(v.id)).map(v=><figure key={v.id}><RecipeThumbnail limit={640} url={image?.objectUrl} adjustments={v.adjustments} geometry={v.geometry} layers={v.layers}/><figcaption>{v.name}</figcaption></figure>)}</section>}
      {projectId && !versions.length && <div className="mini-empty"> <T text={"No snapshots yet."} /> </div>}
    </div>
  );
}
