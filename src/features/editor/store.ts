"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "./defaults";
import type {
  Adjustments,
  AdjustmentKey,
  AspectRatio,
  EditorSnapshot,
  Geometry,
  ImportedImage,
  EditorLayer,
} from "./types";

type EditorState = {
  image: ImportedImage | null;
  layers: EditorLayer[];
  activeLayerId: string | null;
  maskEditing: boolean;
  brushRadius: number;
  brushErase: boolean;
  setActiveLayer: (id: string | null) => void;
  setMaskEditing: (value: boolean) => void;
  setBrush: (radius: number, erase: boolean) => void;
  addLayer: (layer: EditorLayer) => void;
  previewLayer: (id: string, patch: Partial<EditorLayer>) => void;
  cancelLayerPreview: () => void;
  updateLayer: (id: string, patch: Partial<EditorLayer>) => void;
  duplicateLayer: (id:string) => void;
  updateGroup: (group:string,patch:Pick<EditorLayer,"visible">) => void;
  removeLayer: (id: string) => void;
  moveLayer: (id: string, direction: number) => void;
  restoreSnapshot: (snapshot: EditorSnapshot) => void;
  currentProjectId: string | null;
  adjustments: Adjustments;
  geometry: Geometry;
  committed: EditorSnapshot;
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  zoom: number;
  panX: number;
  panY: number;
  showOriginal: boolean;
  activePreset: string | null;
  setImage: (image: ImportedImage | null) => void;
  setCurrentProjectId: (id: string | null) => void;
  previewAdjustment: (key: AdjustmentKey, value: number) => void;
  commitAdjustments: () => void;
  applyAdjustments: (values: Partial<Adjustments>, presetId?: string | null) => void;
  loadRecipe: (adjustments: Adjustments, geometry: Geometry, layers?: EditorLayer[]) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  resetAdjustment: (key: AdjustmentKey) => void;
  resetSection: (keys: AdjustmentKey[]) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleOriginal: (value?: boolean) => void;
  rotateClockwise: () => void;
  toggleFlipX: () => void;
  toggleFlipY: () => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setStraighten: (value: number) => void;
  setCrop: (crop: Partial<Pick<Geometry, "cropX" | "cropY" | "cropWidth" | "cropHeight">>) => void;
  setPerspective: (x: number, y: number) => void;
  resetGeometry: () => void;
};

const cloneAdjustments = (value: Partial<Adjustments>): Adjustments => ({
  ...DEFAULT_ADJUSTMENTS,
  ...value,
});
const cloneGeometry = (value: Partial<Geometry>): Geometry => ({
  ...DEFAULT_GEOMETRY,
  ...value,
});
const cloneSnapshot = (value: EditorSnapshot): EditorSnapshot => ({
  adjustments: cloneAdjustments(value.adjustments),
  geometry: cloneGeometry(value.geometry),
  layers: structuredClone(value.layers ?? []),
});
const makeSnapshot = (
  adjustments: Partial<Adjustments>,
  geometry: Partial<Geometry>,
  layers: EditorLayer[] = [],
): EditorSnapshot => ({
  adjustments: cloneAdjustments(adjustments),
  geometry: cloneGeometry(geometry),
  layers: structuredClone(layers),
});
const sameSnapshot = (a: EditorSnapshot, b: EditorSnapshot) =>
  JSON.stringify(a) === JSON.stringify(b);
const initialSnapshot = makeSnapshot(DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY);
const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => {
      const commitGeometry = (nextGeometry: Geometry) => {
        const state = get();
        const next = makeSnapshot(state.adjustments, nextGeometry, state.layers);
        if (sameSnapshot(next, state.committed)) return;
        set({
          geometry: cloneGeometry(nextGeometry),
          committed: next,
          past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
          future: [],
          activePreset: null,
        });
      };

      const commitLayers = (layers: EditorLayer[]) => {
        const state = get();
        const next = makeSnapshot(state.adjustments, state.geometry, layers);
        if (sameSnapshot(next,state.committed)) return;
        set({ layers, committed: next, past: [...state.past, cloneSnapshot(state.committed)].slice(-40), future: [] });
      };
      return {
        layers: [], activeLayerId: null, maskEditing: false, brushRadius: .04, brushErase: false,
        setActiveLayer: (activeLayerId) => set({ activeLayerId }),
        setMaskEditing: (maskEditing) => set({ maskEditing }),
        setBrush: (brushRadius, brushErase) => set({ brushRadius, brushErase }),
        addLayer: (layer) => { const state = get(); if (state.layers.length >= 20) throw new Error("Maximum 20 layers per project"); commitLayers([...state.layers, layer]); set({ activeLayerId: layer.id }); },
        previewLayer: (id,patch) => set({layers:get().layers.map(layer=>layer.id===id&&!layer.locked?{...layer,...patch,id}:layer)}),
        cancelLayerPreview: () => set({layers:structuredClone(get().committed.layers??[])}),
        updateLayer: (id, patch) => commitLayers(get().layers.map((layer) => layer.id === id ? (layer.locked ? (Object.keys(patch).length===1&&typeof patch.locked==="boolean"?{...layer,locked:patch.locked}:layer) : { ...layer, ...patch, id }) : layer)),
        duplicateLayer: (id) => {const state=get(),layer=state.layers.find(l=>l.id===id);if(!layer||state.layers.length>=20)return;const copy={...structuredClone(layer),id:crypto.randomUUID(),name:`${layer.name} Copy`.slice(0,100),locked:false};const layers=[...state.layers];layers.splice(layers.indexOf(layer)+1,0,copy);commitLayers(layers);set({activeLayerId:copy.id});},
        updateGroup:(group,patch)=>commitLayers(get().layers.map(l=>l.group===group&&!l.locked?{...l,...patch}:l)),
        removeLayer: (id) => { if(get().layers.find(l=>l.id===id)?.locked)return; commitLayers(get().layers.filter((layer) => layer.id !== id)); if (get().activeLayerId === id) set({ activeLayerId: null, maskEditing: false }); },
        moveLayer: (id, direction) => { if(get().layers.find(l=>l.id===id)?.locked)return; const layers = [...get().layers]; const index = layers.findIndex((l) => l.id === id); const next = Math.max(0, Math.min(layers.length - 1, index + direction)); if (index < 0 || next === index) return; [layers[index], layers[next]] = [layers[next], layers[index]]; commitLayers(layers); },
        restoreSnapshot: (snapshot) => { const state = get(); const next = cloneSnapshot(snapshot); set({ adjustments: next.adjustments, geometry: next.geometry, layers: next.layers ?? [], committed: next, past: [...state.past, cloneSnapshot(state.committed)].slice(-40), future: [], activePreset: null }); },
        image: null,
        currentProjectId: null,
        adjustments: cloneAdjustments(DEFAULT_ADJUSTMENTS),
        geometry: cloneGeometry(DEFAULT_GEOMETRY),
        committed: cloneSnapshot(initialSnapshot),
        past: [],
        future: [],
        zoom: 1,
        panX: 0,
        panY: 0,
        showOriginal: false,
        activePreset: null,

        setImage: (image) =>
          set({
            image,
            layers: [], activeLayerId: null, maskEditing: false, showOriginal: false,
            currentProjectId: null,
            adjustments: cloneAdjustments(DEFAULT_ADJUSTMENTS),
            geometry: cloneGeometry(DEFAULT_GEOMETRY),
            committed: cloneSnapshot(initialSnapshot),
            past: [],
            future: [],
            zoom: 1,
            panX: 0,
            panY: 0,
            activePreset: null,
          }),
        setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
        previewAdjustment: (key, value) =>
          set((state) => ({
            adjustments: { ...state.adjustments, [key]: value },
            activePreset: null,
          })),
        commitAdjustments: () => {
          const state = get();
          const next = makeSnapshot(state.adjustments, state.geometry, state.layers);
          if (sameSnapshot(next, state.committed)) return;
          set({
            committed: next,
            past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
            future: [],
          });
        },
        applyAdjustments: (values, presetId = null) => {
          const state = get();
          const nextAdjustments = cloneAdjustments({ ...state.adjustments, ...values });
          const next = makeSnapshot(nextAdjustments, state.geometry, state.layers);
          if (sameSnapshot(next, state.committed)) return;
          set({
            adjustments: nextAdjustments,
            committed: next,
            past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
            future: [],
            activePreset: presetId,
          });
        },
        loadRecipe: (adjustments, geometry, layers = []) => {
          const normalizedAdjustments = cloneAdjustments(adjustments);
          const normalizedGeometry = cloneGeometry(geometry);
          const snapshot = makeSnapshot(normalizedAdjustments, normalizedGeometry, layers);
          set({
            adjustments: normalizedAdjustments,
            geometry: normalizedGeometry,
            layers: structuredClone(layers),
            activeLayerId: layers.at(-1)?.id ?? null,
            maskEditing: false,
            committed: snapshot,
            past: [],
            future: [],
            activePreset: null,
          });
        },
        undo: () =>
          set((state) => {
            if (!state.past.length) return state;
            const previous = state.past[state.past.length - 1];
            return {
              past: state.past.slice(0, -1),
              future: [cloneSnapshot(state.committed), ...state.future].slice(0, 100),
              adjustments: cloneAdjustments(previous.adjustments),
              geometry: cloneGeometry(previous.geometry),
              layers: structuredClone(previous.layers ?? []),
              committed: cloneSnapshot(previous),
              activePreset: null,
            };
          }),
        redo: () =>
          set((state) => {
            if (!state.future.length) return state;
            const next = state.future[0];
            return {
              past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
              future: state.future.slice(1),
              adjustments: cloneAdjustments(next.adjustments),
              geometry: cloneGeometry(next.geometry),
              layers: structuredClone(next.layers ?? []),
              committed: cloneSnapshot(next),
              activePreset: null,
            };
          }),
        reset: () => {
          const state = get();
          const next = cloneSnapshot(initialSnapshot);
          if (sameSnapshot(next, state.committed)) return;
          set({
            adjustments: cloneAdjustments(DEFAULT_ADJUSTMENTS),
            geometry: cloneGeometry(DEFAULT_GEOMETRY),
            layers: [],
            committed: next,
            past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
            future: [],
            activePreset: null,
          });
        },
        resetAdjustment: (key) => {
          const state = get();
          const adjustments = { ...state.adjustments, [key]: DEFAULT_ADJUSTMENTS[key] };
          const next = makeSnapshot(adjustments, state.geometry, state.layers);
          if (sameSnapshot(next, state.committed)) return;
          set({
            adjustments,
            committed: next,
            past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
            future: [],
            activePreset: null,
          });
        },
        resetSection: (keys) => {
          const state = get();
          const adjustments = { ...state.adjustments };
          for (const key of keys) adjustments[key] = DEFAULT_ADJUSTMENTS[key];
          const next = makeSnapshot(adjustments, state.geometry, state.layers);
          if (sameSnapshot(next, state.committed)) return;
          set({
            adjustments,
            committed: next,
            past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
            future: [],
            activePreset: null,
          });
        },
        setZoom: (zoom) => set({ zoom: Math.min(8, Math.max(0.1, zoom)) }),
        setPan: (panX, panY) => set({ panX, panY }),
        toggleOriginal: (value) =>
          set((state) => ({ showOriginal: value ?? !state.showOriginal })),
        rotateClockwise: () => {
          const state = get();
          commitGeometry({
            ...state.geometry,
            rotation: ((state.geometry.rotation + 90) % 360) as Geometry["rotation"],
          });
        },
        toggleFlipX: () => {
          const state = get();
          commitGeometry({ ...state.geometry, flipX: !state.geometry.flipX });
        },
        toggleFlipY: () => {
          const state = get();
          commitGeometry({ ...state.geometry, flipY: !state.geometry.flipY });
        },
        setAspectRatio: (aspectRatio) => {
          const state = get();
          commitGeometry({ ...state.geometry, aspectRatio });
        },
        setStraighten: (straighten) => {
          const state = get();
          commitGeometry({
            ...state.geometry,
            straighten: Math.max(-45, Math.min(45, straighten)),
          });
        },
        setCrop: (crop) => {
          const state = get();
          const cropWidth = Math.max(0.1, Math.min(1, crop.cropWidth ?? state.geometry.cropWidth));
          const cropHeight = Math.max(0.1, Math.min(1, crop.cropHeight ?? state.geometry.cropHeight));
          const cropX = Math.min(1 - cropWidth, clampUnit(crop.cropX ?? state.geometry.cropX));
          const cropY = Math.min(1 - cropHeight, clampUnit(crop.cropY ?? state.geometry.cropY));
          commitGeometry({
            ...state.geometry,
            aspectRatio: "free",
            cropX,
            cropY,
            cropWidth,
            cropHeight,
          });
        },
        setPerspective: (perspectiveX, perspectiveY) => {
          const state = get();
          commitGeometry({
            ...state.geometry,
            perspectiveMode: "projective",
            perspectiveX: Math.max(-100, Math.min(100, perspectiveX)),
            perspectiveY: Math.max(-100, Math.min(100, perspectiveY)),
          });
        },
        resetGeometry: () => commitGeometry(cloneGeometry(DEFAULT_GEOMETRY)),
      };
    },
    {
      name: "lumaforge-editor-v4",
      // Image recipes and layers live in IndexedDB drafts, not synchronous localStorage.
      partialize: (state) => ({ currentProjectId: state.currentProjectId }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<EditorState>;
        const adjustments = cloneAdjustments(stored.adjustments ?? current.adjustments);
        const geometry = cloneGeometry(stored.geometry ?? current.geometry);
        const committed = stored.committed
          ? makeSnapshot(stored.committed.adjustments, stored.committed.geometry, stored.committed.layers)
          : makeSnapshot(adjustments, geometry);
        const normalizeHistory = (items?: EditorSnapshot[]) =>
          (items ?? []).map((item) => makeSnapshot(item.adjustments, item.geometry, item.layers)).slice(-100);
        return {
          ...current,
          ...stored,
          adjustments,
          geometry,
          committed,
          past: normalizeHistory(stored.past),
          future: normalizeHistory(stored.future),
        };
      },
    },
  ),
);
