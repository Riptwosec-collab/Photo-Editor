"use client";
import { T } from "@/features/i18n/text";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/features/editor/store";
import type { StoredProject } from "@/features/editor/types";
import { recordsByPrefix, removeRecord } from "@/lib/local-records";
import { importBackup } from "@/features/projects/backup";
export function RecoveryPanel() {
  const [drafts, setDrafts] = useState<Array<{ id: string; value: { project: StoredProject; projectId: string | null } }>>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { recordsByPrefix<{ project: StoredProject; projectId: string | null }>("draft:").then((rows) => setDrafts(rows.sort((a,b) => b.value.project.updatedAt.localeCompare(a.value.project.updatedAt)).slice(0,5))).catch(() => setMessage("Draft storage is unavailable")); }, []);
  function open(project: StoredProject, id: string | null) { const s = useEditorStore.getState(); s.setImage({ name: project.imageName, type: project.imageType, width: project.width, height: project.height, size: project.imageBlob.size, objectUrl: URL.createObjectURL(project.imageBlob) }); s.loadRecipe(project.adjustments, project.geometry, project.layers); s.setCurrentProjectId(id); }
  return <section className="recovery-panel"><label className="button"> <T text={"Import project backup"} /> <input hidden type="file" accept=".json,.lumaforge" onChange={async (event) => { const f = event.target.files?.[0]; if (!f) return; try { const p = await importBackup(f); open(p,p.id); } catch (e) { setMessage(e instanceof Error ? e.message : "Import failed"); } }} /></label>{drafts.map(({ id, value }) => <div className="recovery-row" key={id}><span><strong>{value.project.name}</strong><small>{new Date(value.project.updatedAt).toLocaleString()}</small></span><button onClick={() => open(value.project, value.projectId)}> <T text={"Recover draft"} /> </button><button aria-label={`Discard draft ${value.project.name}`} onClick={() => void removeRecord(id).then(() => setDrafts((rows) => rows.filter((r) => r.id !== id))).catch(() => setMessage("Could not discard draft"))}>×</button></div>)}{message && <p role="status"><T text={message} /></p>}</section>;
}
