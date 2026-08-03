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
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleOriginal: (value?: boolean) => void;
  rotateClockwise: () => void;
  toggleFlipX: () => void;
  toggleFlipY: () => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  resetGeometry: () => void;
};

const cloneAdjustments = (value: Adjustments): Adjustments => ({ ...value });
const cloneGeometry = (value: Geometry): Geometry => ({ ...value });
const cloneSnapshot = (value: EditorSnapshot): EditorSnapshot => ({
  adjustments: cloneAdjustments(value.adjustments),
  geometry: cloneGeometry(value.geometry),
});
const makeSnapshot = (adjustments: Adjustments, geometry: Geometry): EditorSnapshot => ({
  adjustments: cloneAdjustments(adjustments),
  geometry: cloneGeometry(geometry),
});
const sameSnapshot = (a: EditorSnapshot, b: EditorSnapshot) => JSON.stringify(a) === JSON.stringify(b);

const initialSnapshot = makeSnapshot(DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY);

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
          past: [...state.past, cloneSnapshot(state.committed)].slice(-80),
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
            past: [...state.past, cloneSnapshot(state.committed)].slice(-80),
            future: [],
          });
        },
        applyAdjustments: (values, presetId = null) => {
          const state = get();
          const nextAdjustments = { ...state.adjustments, ...values };
          const next = makeSnapshot(nextAdjustments, state.geometry);
          set({
            adjustments: nextAdjustments,
            committed: next,
            past: [...state.past, cloneSnapshot(state.committed)].slice(-80),
            future: [],
            activePreset: presetId,
          });
        },
        loadRecipe: (adjustments, geometry) => {
          const snapshot = makeSnapshot(adjustments, geometry);
          set({
            adjustments: cloneAdjustments(adjustments),
            geometry: cloneGeometry(geometry),
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
              future: [cloneSnapshot(state.committed), ...state.future].slice(0, 80),
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
              past: [...state.past, cloneSnapshot(state.committed)].slice(-80),
              future: state.future.slice(1),
              adjustments: cloneAdjustments(next.adjustments),
              geometry: cloneGeometry(next.geometry),
              committed: cloneSnapshot(next),
              activePreset: null,
            };
          }),
        reset: () => {
          const state = get();
          set({
            adjustments: cloneAdjustments(DEFAULT_ADJUSTMENTS),
            geometry: cloneGeometry(DEFAULT_GEOMETRY),
            committed: cloneSnapshot(initialSnapshot),
            past: [...state.past, cloneSnapshot(state.committed)].slice(-80),
            future: [],
            activePreset: null,
          });
        },
        setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.25, zoom)) }),
        setPan: (panX, panY) => set({ panX, panY }),
        toggleOriginal: (value) => set((state) => ({ showOriginal: value ?? !state.showOriginal })),
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
        resetGeometry: () => commitGeometry(cloneGeometry(DEFAULT_GEOMETRY)),
      };
    },
    {
      name: "lumaforge-editor-v3",
      partialize: (state) => ({
        adjustments: state.committed.adjustments,
        geometry: state.committed.geometry,
        committed: state.committed,
        past: state.past,
        future: state.future,
        activePreset: state.activePreset,
        currentProjectId: state.currentProjectId,
      }),
    },
  ),
);
