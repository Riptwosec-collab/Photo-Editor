"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompareMode = "off" | "vertical" | "horizontal" | "blink" | "grid";
export type AutoEnhanceMode =
  | "balanced"
  | "natural"
  | "portrait"
  | "night"
  | "vivid"
  | "cinematic"
  | "professional"
  | "social"
  | "print";
export type DirectorDirection = "natural" | "premium" | "cinematic" | "dramatic";
export type AiStatus = "idle" | "analyzing" | "planned" | "applying" | "completed" | "cancelled" | "error";
export type SelectiveTarget = "subject" | "face" | "skin" | "eyes" | "hair" | "clothing" | "background" | "colors" | "exposure" | "crop";
export type LockTarget = "identity" | "skinTone" | "background" | "face" | "colors" | "crop";

const defaultSelective: Record<SelectiveTarget, boolean> = {
  subject: true,
  face: true,
  skin: true,
  eyes: false,
  hair: false,
  clothing: false,
  background: true,
  colors: true,
  exposure: true,
  crop: false,
};

const defaultLocks: Record<LockTarget, boolean> = {
  identity: true,
  skinTone: true,
  background: false,
  face: true,
  colors: false,
  crop: true,
};

type StudioState = {
  sidebarCollapsed: boolean;
  assistantCollapsed: boolean;
  inspectorCollapsed: boolean;
  filmstripCollapsed: boolean;
  compareMode: CompareMode;
  comparePosition: number;
  gridVisible: boolean;
  guidesVisible: boolean;
  safeZonesVisible: boolean;
  clippingVisible: boolean;
  maskOverlayVisible: boolean;
  transparentBackground: boolean;
  softProof: boolean;
  autoMode: AutoEnhanceMode;
  autoIntensity: number;
  selective: Record<SelectiveTarget, boolean>;
  locks: Record<LockTarget, boolean>;
  directorDirection: DirectorDirection;
  aiStatus: AiStatus;
  aiProgress: number;
  aiMessage: string;
  activeInspectorSection: string;
  setSidebarCollapsed: (value: boolean) => void;
  setAssistantCollapsed: (value: boolean) => void;
  setInspectorCollapsed: (value: boolean) => void;
  setFilmstripCollapsed: (value: boolean) => void;
  setCompareMode: (mode: CompareMode) => void;
  setComparePosition: (position: number) => void;
  toggleCanvasFlag: (flag: "gridVisible" | "guidesVisible" | "safeZonesVisible" | "clippingVisible" | "maskOverlayVisible" | "transparentBackground" | "softProof") => void;
  setAutoMode: (mode: AutoEnhanceMode) => void;
  setAutoIntensity: (intensity: number) => void;
  toggleSelective: (target: SelectiveTarget) => void;
  toggleLock: (target: LockTarget) => void;
  setDirectorDirection: (direction: DirectorDirection) => void;
  setAiOperation: (status: AiStatus, progress?: number, message?: string) => void;
  setActiveInspectorSection: (section: string) => void;
  resetAiOperation: () => void;
};

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      assistantCollapsed: false,
      inspectorCollapsed: false,
      filmstripCollapsed: false,
      compareMode: "vertical",
      comparePosition: 50,
      gridVisible: false,
      guidesVisible: false,
      safeZonesVisible: false,
      clippingVisible: false,
      maskOverlayVisible: false,
      transparentBackground: false,
      softProof: false,
      autoMode: "balanced",
      autoIntensity: 65,
      selective: defaultSelective,
      locks: defaultLocks,
      directorDirection: "cinematic",
      aiStatus: "idle",
      aiProgress: 0,
      aiMessage: "Ready for local analysis",
      activeInspectorSection: "histogram",
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setAssistantCollapsed: (assistantCollapsed) => set({ assistantCollapsed }),
      setInspectorCollapsed: (inspectorCollapsed) => set({ inspectorCollapsed }),
      setFilmstripCollapsed: (filmstripCollapsed) => set({ filmstripCollapsed }),
      setCompareMode: (compareMode) => set({ compareMode }),
      setComparePosition: (comparePosition) =>
        set({ comparePosition: Math.max(0, Math.min(100, comparePosition)) }),
      toggleCanvasFlag: (flag) => set((state) => ({ [flag]: !state[flag] } as Partial<StudioState>)),
      setAutoMode: (autoMode) => set({ autoMode }),
      setAutoIntensity: (autoIntensity) =>
        set({ autoIntensity: Math.max(0, Math.min(100, autoIntensity)) }),
      toggleSelective: (target) =>
        set((state) => ({ selective: { ...state.selective, [target]: !state.selective[target] } })),
      toggleLock: (target) =>
        set((state) => ({ locks: { ...state.locks, [target]: !state.locks[target] } })),
      setDirectorDirection: (directorDirection) => set({ directorDirection }),
      setAiOperation: (aiStatus, aiProgress = 0, aiMessage = "") =>
        set({ aiStatus, aiProgress, aiMessage }),
      setActiveInspectorSection: (activeInspectorSection) => set({ activeInspectorSection }),
      resetAiOperation: () => set({ aiStatus: "idle", aiProgress: 0, aiMessage: "Ready for local analysis" }),
    }),
    {
      name: "lumaforge-studio-ui-v1",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        assistantCollapsed: state.assistantCollapsed,
        inspectorCollapsed: state.inspectorCollapsed,
        filmstripCollapsed: state.filmstripCollapsed,
        compareMode: state.compareMode,
        comparePosition: state.comparePosition,
        autoMode: state.autoMode,
        autoIntensity: state.autoIntensity,
        selective: state.selective,
        locks: state.locks,
        directorDirection: state.directorDirection,
      }),
    },
  ),
);
