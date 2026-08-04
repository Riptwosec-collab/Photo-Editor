"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, Copy, GitBranch, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { StoredVersion } from "@/features/editor/types";
import { deleteVersion, listVersions, renameVersion, saveVersion } from "@/lib/idb";

export function VersionPanel({ projectId, embedded = false }: { projectId: string | null; embedded?: boolean }) {
  const adjustments = useEditorStore((state) => state.adjustments);
  const geometry = useEditorStore((state) => state.geometry);
  const loadRecipe = useEditorStore((state) => state.loadRecipe);
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
    const timer = window.setTimeout(() => void refresh(), 0);
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
      name: name ?? `Snapshot ${versions.length + 1}`,
      createdAt: now.toISOString(),
      adjustments: { ...adjustments },
      geometry: { ...geometry },
    };
    try {
      await saveVersion(version);
      await refresh();
      setStatus("Snapshot created");
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
    await saveVersion({ ...version, id: crypto.randomUUID(), name: `${version.name} Branch`, note: `Branched from ${version.name}`, createdAt: new Date().toISOString() });
    await refresh();
    setStatus("Version branch created");
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
      {!embedded && <div className="panel-title"><div><span className="kicker">Non-destructive</span><h2>Snapshots</h2></div><button className="icon-button" title="Refresh snapshots" onClick={() => void refresh()}><RotateCcw size={16} /></button></div>}
      <p className="control-note">Snapshots store the edit recipe and geometry. Original image bytes are never overwritten.</p>
      <div className="version-primary-actions"><button className="button primary compact" disabled={!projectId} onClick={() => void createSnapshot()}><Camera size={15} /> Create snapshot</button><button className="icon-button" title="Refresh snapshots" onClick={() => void refresh()}><RotateCcw size={14} /></button></div>
      {!projectId && <p className="version-hint">Save this project first to enable durable snapshots.</p>}
      {status && <p role="status" className="version-status">{status}</p>}
      <div className="version-list">
        {versions.map((version) => (
          <article key={version.id} className="version-row expanded-actions">
            <button className="version-restore" onClick={() => { loadRecipe(version.adjustments, version.geometry); setStatus(`Restored ${version.name}`); }}><strong>{version.name}</strong><small>{new Date(version.createdAt).toLocaleString()}</small></button>
            <button className="icon-button" title="Rename snapshot" onClick={() => void editName(version)}><Pencil size={13} /></button>
            <button className="icon-button" title="Duplicate version" onClick={() => void duplicateVersion(version)}><Copy size={13} /></button>
            <button className="icon-button" title="Branch version" onClick={() => void branchVersion(version)}><GitBranch size={13} /></button>
            <button className="icon-button danger-button" title="Delete snapshot" onClick={() => void remove(version)}><Trash2 size={13} /></button>
          </article>
        ))}
      </div>
      {projectId && !versions.length && <div className="mini-empty">No snapshots yet.</div>}
    </div>
  );
}
