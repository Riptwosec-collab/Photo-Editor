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
} from "./types";

type EditorState = {
  image: ImportedImage | null;
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
  loadRecipe: (adjustments: Adjustments, geometry: Geometry) => void;
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
});
const makeSnapshot = (
  adjustments: Partial<Adjustments>,
  geometry: Partial<Geometry>,
): EditorSnapshot => ({
  adjustments: cloneAdjustments(adjustments),
  geometry: cloneGeometry(geometry),
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
        const next = makeSnapshot(state.adjustments, nextGeometry);
        if (sameSnapshot(next, state.committed)) return;
        set({
          geometry: cloneGeometry(nextGeometry),
          committed: next,
          past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
          future: [],
          activePreset: null,
        });
      };

      return {
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
          const next = makeSnapshot(state.adjustments, state.geometry);
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
          const next = makeSnapshot(nextAdjustments, state.geometry);
          if (sameSnapshot(next, state.committed)) return;
          set({
            adjustments: nextAdjustments,
            committed: next,
            past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
            future: [],
            activePreset: presetId,
          });
        },
        loadRecipe: (adjustments, geometry) => {
          const normalizedAdjustments = cloneAdjustments(adjustments);
          const normalizedGeometry = cloneGeometry(geometry);
          const snapshot = makeSnapshot(normalizedAdjustments, normalizedGeometry);
          set({
            adjustments: normalizedAdjustments,
            geometry: normalizedGeometry,
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
            committed: next,
            past: [...state.past, cloneSnapshot(state.committed)].slice(-100),
            future: [],
            activePreset: null,
          });
        },
        resetAdjustment: (key) => {
          const state = get();
          const adjustments = { ...state.adjustments, [key]: DEFAULT_ADJUSTMENTS[key] };
          const next = makeSnapshot(adjustments, state.geometry);
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
          const next = makeSnapshot(adjustments, state.geometry);
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
            perspectiveX: Math.max(-100, Math.min(100, perspectiveX)),
            perspectiveY: Math.max(-100, Math.min(100, perspectiveY)),
          });
        },
        resetGeometry: () => commitGeometry(cloneGeometry(DEFAULT_GEOMETRY)),
      };
    },
    {
      name: "lumaforge-editor-v4",
      partialize: (state) => ({
        adjustments: state.committed.adjustments,
        geometry: state.committed.geometry,
        committed: state.committed,
        past: state.past,
        future: state.future,
        activePreset: state.activePreset,
        currentProjectId: state.currentProjectId,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<EditorState>;
        const adjustments = cloneAdjustments(stored.adjustments ?? current.adjustments);
        const geometry = cloneGeometry(stored.geometry ?? current.geometry);
        const committed = stored.committed
          ? makeSnapshot(stored.committed.adjustments, stored.committed.geometry)
          : makeSnapshot(adjustments, geometry);
        const normalizeHistory = (items?: EditorSnapshot[]) =>
          (items ?? []).map((item) => makeSnapshot(item.adjustments, item.geometry)).slice(-100);
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
