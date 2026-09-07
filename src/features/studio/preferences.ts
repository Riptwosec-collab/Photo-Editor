"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Preferences = {
  reducedMotion: boolean;
  performanceMode: boolean;
  autosave: boolean;
  setPreference: (key: "reducedMotion" | "performanceMode" | "autosave", value: boolean) => void;
};
export const usePreferences = create<Preferences>()(persist((set) => ({
  reducedMotion: false,
  performanceMode: false,
  autosave: true,
  setPreference: (key, value) => set({ [key]: value }),
}), { name: "lumaforge-preferences-v1" }));
