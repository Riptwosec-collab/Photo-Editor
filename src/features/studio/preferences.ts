"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Preferences = {
  theme: "midnight" | "blue-glass" | "graphite";
  language: "th" | "en";
  focusMode: boolean;
  panelHeight: number;
  favoritePresets: string[];
  toggleFavoritePreset: (id: string) => void;
  setTheme: (theme: "midnight" | "blue-glass" | "graphite") => void;
  setLanguage: (language: "th" | "en") => void;
  setPanelHeight: (panelHeight: number) => void;
  toggleFocus: () => void;
  reducedMotion: boolean;
  performanceMode: boolean;
  autosave: boolean;
  setPreference: (key: "reducedMotion" | "performanceMode" | "autosave", value: boolean) => void;
};
export const usePreferences = create<Preferences>()(persist((set) => ({
  theme: "blue-glass", language: "th", focusMode: false, panelHeight: 65, favoritePresets: [],
  setTheme: (theme) => set({ theme }), setLanguage: (language) => set({ language }), setPanelHeight: (panelHeight) => set({ panelHeight }), toggleFocus: () => set((s) => ({ focusMode: !s.focusMode })),
  toggleFavoritePreset: (id) => set((s) => ({ favoritePresets: s.favoritePresets.includes(id) ? s.favoritePresets.filter((x) => x !== id) : [...s.favoritePresets, id] })),
  reducedMotion: false,
  performanceMode: false,
  autosave: true,
  setPreference: (key, value) => set({ [key]: value }),
}), { name: "lumaforge-preferences-v1" }));
