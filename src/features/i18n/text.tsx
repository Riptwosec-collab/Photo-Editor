"use client";
import { usePreferences } from "@/features/studio/preferences";
import { thai, english } from "./dictionary";
export function translate(text: string, language: "th" | "en") {
  const normalized = text.trim();
  return (language === "th" ? thai[normalized] : english[normalized]) ?? text;
}
export function T({ text }: { text: string | number | undefined | null }) {
  const language = usePreferences((s) => s.language);
  return <>{text == null ? "" : translate(String(text),language)}</>;
}
export function useT() { const language = usePreferences((s) => s.language); return (text: string) => translate(text,language); }
