"use client";
import { useEffect } from "react";
import { useEditorStore } from "@/features/editor/store";
import { putRecord } from "@/lib/local-records";
import type { StoredProject } from "@/features/editor/types";
import { create } from "zustand";
export const useDraftStatus = create<{ message: string; pending: boolean }>(() => ({ message: "", pending: false }));
export function DraftManager() {
  useEffect(() => {
    const tabId = sessionStorage.getItem("lf-draft-tab") ?? crypto.randomUUID(); sessionStorage.setItem("lf-draft-tab", tabId);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let firstPending = 0;
    let chain = Promise.resolve();
    let lastImage = "";
    let original: Promise<Blob> | null = null;
    function save() {
      clearTimeout(timer); firstPending = 0;
      const state = useEditorStore.getState(); if (!state.image) return;
      const image = state.image;
      if (lastImage !== image.objectUrl) { lastImage = image.objectUrl; original = fetch(image.objectUrl).then((r) => r.blob()); }
      const blob = original!;
      const snapshot = structuredClone(state.committed);
      const projectId = state.currentProjectId;
      useDraftStatus.setState({ pending: true });
      chain = chain.catch(() => {}).then(async () => {
        const now = new Date().toISOString();
        const project: StoredProject = { id: projectId ?? `draft-${tabId}`, name: image.name.replace(/\.[^.]+$/, ""), imageBlob: await blob, imageName: image.name, imageType: image.type, width: image.width, height: image.height, createdAt: now, updatedAt: now, adjustments: snapshot.adjustments, geometry: snapshot.geometry, layers: snapshot.layers ?? [] };
        await putRecord(`draft:${tabId}`, { project, projectId });
        useDraftStatus.setState({ pending: false, message: "Draft saved on this device" });
      }).catch(() => useDraftStatus.setState({ pending: false, message: "Draft save failed — export a project backup" }));
    }
    const unsubscribe = useEditorStore.subscribe((next, previous) => {
      if (!next.image || (next.committed === previous.committed && next.image === previous.image && next.currentProjectId === previous.currentProjectId)) return;
      useDraftStatus.setState({ pending: true });
      if (next.image !== previous.image) { save(); return; }
      firstPending ||= Date.now(); clearTimeout(timer);
      timer = setTimeout(save, Math.max(0, Math.min(600, 2500 - (Date.now() - firstPending))));
    });
    const onVisibility = () => { if (document.visibilityState === "hidden") save(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", save);
    return () => { save(); unsubscribe(); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", save); };
  }, []);
  return null;
}
