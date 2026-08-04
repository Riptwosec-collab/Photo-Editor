"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  FileImage,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { deriveColorMatch, type AverageColor } from "@/features/editor/intelligence";
import { useEditorStore } from "@/features/editor/store";
import type { Adjustments } from "@/features/editor/types";
import { listProjects, saveProject, saveUserPreset } from "@/lib/idb";
import { ProgressBar, SegmentedControl, Toggle } from "@/components/ui/editor-controls";

async function averageFromUrl(url: string): Promise<AverageColor> {
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas analysis unavailable");
  context.drawImage(image, 0, 0, 64, 64);
  const pixels = context.getImageData(0, 0, 64, 64).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let index = 0; index < pixels.length; index += 16) {
    if (pixels[index + 3] < 32) continue;
    r += pixels[index];
    g += pixels[index + 1];
    b += pixels[index + 2];
    count += 1;
  }
  if (!count) throw new Error("Reference image contains no visible pixels");
  r /= count;
  g /= count;
  b /= count;
  return { r, g, b, luminance: 0.2126 * r + 0.7152 * g + 0.0722 * b };
}

function downloadText(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function createCube(recipe: Partial<Adjustments>) {
  const size = 8;
  const temperature = Number(recipe.temperature ?? 0) / 255;
  const tint = Number(recipe.tint ?? 0) / 255;
  const exposure = Math.pow(2, Number(recipe.exposure ?? 0));
  const lines = [
    "TITLE \"LumaForge Reference Match\"",
    `LUT_3D_SIZE ${size}`,
    "DOMAIN_MIN 0.0 0.0 0.0",
    "DOMAIN_MAX 1.0 1.0 1.0",
  ];
  for (let blueIndex = 0; blueIndex < size; blueIndex += 1) {
    for (let greenIndex = 0; greenIndex < size; greenIndex += 1) {
      for (let redIndex = 0; redIndex < size; redIndex += 1) {
        const red = Math.max(0, Math.min(1, (redIndex / (size - 1)) * exposure + temperature * 0.18 + tint * 0.05));
        const green = Math.max(0, Math.min(1, (greenIndex / (size - 1)) * exposure - tint * 0.12));
        const blue = Math.max(0, Math.min(1, (blueIndex / (size - 1)) * exposure - temperature * 0.18 + tint * 0.05));
        lines.push(`${red.toFixed(6)} ${green.toFixed(6)} ${blue.toFixed(6)}`);
      }
    }
  }
  return lines.join("\n");
}

type MatchMode = "exact" | "mood" | "film" | "lighting" | "skin-safe" | "subject" | "background";
const matchModes: Array<{ value: MatchMode; label: string }> = [
  { value: "exact", label: "Exact Color" },
  { value: "mood", label: "Mood" },
  { value: "film", label: "Film" },
  { value: "lighting", label: "Lighting" },
  { value: "skin-safe", label: "Skin-Safe" },
  { value: "subject", label: "Subject" },
  { value: "background", label: "Background" },
];

function expandMatchRecipe(
  base: Partial<Adjustments>,
  mode: MatchMode,
  strength: number,
): Partial<Adjustments> {
  const amount = strength / 100;
  if (mode === "film") return { ...base, contrast: 14 * amount, grain: 10 * amount, highlights: -14 * amount };
  if (mode === "mood") return { ...base, vibrance: 12 * amount, shadowSaturation: 12 * amount, highlightSaturation: 8 * amount };
  if (mode === "lighting") return { exposure: base.exposure, highlights: -18 * amount, shadows: 18 * amount, whites: 5 * amount };
  if (mode === "skin-safe") return { ...base, temperature: Number(base.temperature ?? 0) * 0.45, tint: Number(base.tint ?? 0) * 0.45, orangeLuminance: 4 * amount, texture: -4 * amount };
  if (mode === "subject") return { ...base, clarity: 8 * amount, midtoneContrast: 9 * amount };
  if (mode === "background") return { ...base, dehaze: 7 * amount, vignette: 12 * amount };
  return base;
}

export function ReversePresetSection({ onNotice }: { onNotice: (message: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const image = useEditorStore((state) => state.image);
  const apply = useEditorStore((state) => state.applyAdjustments);
  const [reference, setReference] = useState<{ file: File; url: string } | null>(null);
  const [mode, setMode] = useState<MatchMode>("skin-safe");
  const [strength, setStrength] = useState(72);
  const [status, setStatus] = useState<"idle" | "running" | "ready" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [recipe, setRecipe] = useState<Partial<Adjustments> | null>(null);
  const [message, setMessage] = useState("Upload a reference image to begin.");

  useEffect(() => () => {
    if (reference) URL.revokeObjectURL(reference.url);
  }, [reference]);

  function selectReference(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 30 * 1024 * 1024) {
      setStatus("error");
      setMessage("Reference must be a supported image under 30 MB.");
      return;
    }
    if (reference) URL.revokeObjectURL(reference.url);
    setReference({ file, url: URL.createObjectURL(file) });
    setRecipe(null);
    setStatus("idle");
    setMessage(`${file.name} ready for local analysis.`);
  }

  async function generate() {
    if (!image || !reference) {
      setStatus("error");
      setMessage("Import an edit image and choose a reference first.");
      return;
    }
    setStatus("running");
    setProgress(8);
    setMessage("Sampling reference color and luminance…");
    try {
      const [currentAverage, referenceAverage] = await Promise.all([
        averageFromUrl(image.objectUrl),
        averageFromUrl(reference.url),
      ]);
      setProgress(48);
      const base = deriveColorMatch(currentAverage, referenceAverage, strength);
      const nextRecipe = expandMatchRecipe(base, mode, strength);
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      const distance = Math.abs(referenceAverage.r - currentAverage.r) + Math.abs(referenceAverage.g - currentAverage.g) + Math.abs(referenceAverage.b - currentAverage.b);
      setConfidence(Math.max(58, Math.min(96, Math.round(95 - distance / 8))));
      setRecipe(nextRecipe);
      setProgress(100);
      setStatus("ready");
      setMessage("Reference recipe generated locally.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Reference analysis failed");
    }
  }

  async function saveInternal() {
    if (!recipe) return;
    const now = new Date().toISOString();
    await saveUserPreset({
      id: crypto.randomUUID(),
      name: `Reference ${mode} ${new Date().toLocaleDateString()}`,
      description: `Generated locally from ${reference?.file.name ?? "reference image"}`,
      createdAt: now,
      updatedAt: now,
      adjustments: recipe,
      scope: "full",
    });
    onNotice("Reference recipe saved to personal presets");
  }

  const baseName = reference?.file.name.replace(/\.[^.]+$/, "") ?? "lumaforge-reference";
  const xmp = recipe
    ? `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" crs:Exposure2012="${Number(recipe.exposure ?? 0).toFixed(2)}" crs:Temperature="${Math.round(5500 + Number(recipe.temperature ?? 0) * 35)}" crs:Tint="${Math.round(Number(recipe.tint ?? 0))}" /></rdf:RDF></x:xmpmeta>`
    : "";

  return (
    <div className="reference-workflow">
      <input ref={inputRef} hidden type="file" accept="image/*" onChange={(event) => selectReference(event.target.files?.[0])} />
      <button className="reference-picker" type="button" onClick={() => inputRef.current?.click()}>
        {reference ? <img src={reference.url} alt="Reference preview" /> : <ImagePlus size={24} />}
        <span><strong>{reference ? reference.file.name : "Upload reference"}</strong><small>{reference ? "Click to replace" : "JPG, PNG or WebP · max 30 MB"}</small></span>
        <Upload size={15} />
      </button>
      <SegmentedControl value={mode} options={matchModes} onChange={setMode} ariaLabel="Reference match mode" />
      <label className="compact-slider-label"><span>Match strength</span><output>{strength}%</output><input type="range" min="0" max="100" value={strength} onChange={(event) => setStrength(Number(event.target.value))} /></label>
      {status === "running" && <ProgressBar value={progress} label={message} />}
      {status === "error" && <div className="inline-error"><TriangleAlert size={14} />{message}<button onClick={() => void generate()}><RefreshCw size={13} /> Retry</button></div>}
      {status === "ready" && recipe && <div className="reference-result"><div><Check size={15} /><span><strong>Recipe ready</strong><small>{confidence}% confidence · {Object.keys(recipe).length} parameters</small></span></div><p>{message}</p></div>}
      <div className="reference-actions"><button className="button primary" disabled={!reference || !image || status === "running"} onClick={() => void generate()}>{status === "running" ? <LoaderCircle className="spin" size={15} /> : <FileImage size={15} />} Generate preset</button><button className="button" disabled={!recipe} onClick={() => { if (recipe) { apply(recipe); onNotice("Reference recipe applied"); } }}>Apply</button></div>
      <div className="recipe-export-grid">
        <button disabled={!recipe} onClick={() => void saveInternal()}><Download size={13} /> Internal</button>
        <button disabled={!recipe} onClick={() => downloadText(`${baseName}.xmp`, "application/rdf+xml", xmp)}><Download size={13} /> XMP</button>
        <button disabled title="DNG writing requires a native RAW encoder and is not fabricated in the browser"><Download size={13} /> DNG</button>
        <button disabled={!recipe} onClick={() => downloadText(`${baseName}.cube`, "text/plain", createCube(recipe ?? {}))}><Download size={13} /> LUT .cube</button>
        <button disabled={!recipe} onClick={() => downloadText(`${baseName}.json`, "application/json", JSON.stringify({ version: 1, mode, strength, confidence, recipe }, null, 2))}><Download size={13} /> JSON</button>
      </div>
    </div>
  );
}

type ReferenceItem = { id: string; file: File; url: string; average?: AverageColor; error?: string };

export function ColorConsistencySection({ onNotice }: { onNotice: (message: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const image = useEditorStore((state) => state.image);
  const apply = useEditorStore((state) => state.applyAdjustments);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [strength, setStrength] = useState(68);
  const [protectSkin, setProtectSkin] = useState(true);
  const [matchExposure, setMatchExposure] = useState(true);
  const [matchWhiteBalance, setMatchWhiteBalance] = useState(true);
  const [matchGrade, setMatchGrade] = useState(true);
  const [subjectOnly, setSubjectOnly] = useState(false);
  const [backgroundOnly, setBackgroundOnly] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => () => {
    for (const item of references) URL.revokeObjectURL(item.url);
  }, [references]);

  const primary = useMemo(
    () => references.find((item) => item.id === primaryId) ?? references[0],
    [primaryId, references],
  );

  async function addFiles(files?: FileList | null) {
    if (!files) return;
    const next: ReferenceItem[] = [];
    for (const file of Array.from(files).slice(0, 12)) {
      if (!file.type.startsWith("image/") || file.size > 30 * 1024 * 1024) continue;
      const item: ReferenceItem = { id: crypto.randomUUID(), file, url: URL.createObjectURL(file) };
      try {
        item.average = await averageFromUrl(item.url);
      } catch (error) {
        item.error = error instanceof Error ? error.message : "Decode failed";
      }
      next.push(item);
    }
    setReferences((state) => [...state, ...next]);
    setPrimaryId((current) => current ?? next.find((item) => item.average)?.id ?? null);
  }

  async function buildRecipe() {
    if (!image || !primary?.average) throw new Error("Choose a valid primary reference and import an image.");
    const currentAverage = await averageFromUrl(image.objectUrl);
    let recipe = deriveColorMatch(currentAverage, primary.average, strength);
    if (!matchExposure) delete recipe.exposure;
    if (!matchWhiteBalance) {
      delete recipe.temperature;
      delete recipe.tint;
    }
    if (protectSkin) {
      if (recipe.temperature !== undefined) recipe.temperature *= 0.55;
      if (recipe.tint !== undefined) recipe.tint *= 0.55;
      recipe.orangeLuminance = 3;
    }
    if (matchGrade) recipe = { ...recipe, shadowSaturation: 8 * strength / 100, highlightSaturation: 6 * strength / 100 };
    if (subjectOnly) recipe = { ...recipe, clarity: 6 * strength / 100, midtoneContrast: 7 * strength / 100 };
    if (backgroundOnly) recipe = { ...recipe, dehaze: 5 * strength / 100, vignette: 8 * strength / 100 };
    return recipe;
  }

  async function applyCurrent() {
    setStatus("Analyzing current photo and primary reference…");
    setProgress(20);
    try {
      const recipe = await buildRecipe();
      setProgress(72);
      apply(recipe);
      setProgress(100);
      setStatus("Color consistency applied to the current photo.");
      onNotice("Color consistency applied");
    } catch (error) {
      setProgress(0);
      setStatus(error instanceof Error ? error.message : "Color matching failed");
    }
  }

  async function applyAlbum() {
    setStatus("Applying the match recipe to saved projects…");
    setProgress(10);
    try {
      const recipe = await buildRecipe();
      const projects = await listProjects({ includeArchived: false });
      let completed = 0;
      for (const project of projects) {
        await saveProject({
          ...project,
          adjustments: { ...project.adjustments, ...recipe },
          updatedAt: new Date().toISOString(),
        });
        completed += 1;
        setProgress(projects.length ? (completed / projects.length) * 100 : 100);
      }
      setStatus(`Matched ${completed} saved project${completed === 1 ? "" : "s"}.`);
      onNotice(`Color consistency applied to ${completed} projects`);
    } catch (error) {
      setProgress(0);
      setStatus(error instanceof Error ? error.message : "Album matching failed");
    }
  }

  const outliers = references.filter((item) => {
    if (!primary?.average || !item.average || item.id === primary.id) return false;
    return Math.abs(item.average.luminance - primary.average.luminance) > 45;
  });

  return (
    <div className="color-consistency-workflow">
      <input ref={inputRef} hidden multiple type="file" accept="image/*" onChange={(event) => void addFiles(event.target.files)} />
      <div className="reference-strip">
        {references.map((item) => (
          <button key={item.id} className={item.id === primary?.id ? "active" : ""} onClick={() => setPrimaryId(item.id)} title={`${item.file.name}${item.error ? ` · ${item.error}` : ""}`}><img src={item.url} alt="" />{item.id === primary?.id && <Check size={12} />}</button>
        ))}
        <button className="add-reference" onClick={() => inputRef.current?.click()}><ImagePlus size={17} /><span>Add reference</span></button>
      </div>
      <label className="compact-slider-label"><span>Match strength</span><output>{strength}%</output><input type="range" min="0" max="100" value={strength} onChange={(event) => setStrength(Number(event.target.value))} /></label>
      <div className="consistency-options">
        <Toggle label="Protect skin tones" checked={protectSkin} onChange={setProtectSkin} />
        <Toggle label="Match exposure" checked={matchExposure} onChange={setMatchExposure} />
        <Toggle label="Match white balance" checked={matchWhiteBalance} onChange={setMatchWhiteBalance} />
        <Toggle label="Match color grading" checked={matchGrade} onChange={setMatchGrade} />
        <Toggle label="Subject only" checked={subjectOnly} onChange={(value) => { setSubjectOnly(value); if (value) setBackgroundOnly(false); }} />
        <Toggle label="Background only" checked={backgroundOnly} onChange={(value) => { setBackgroundOnly(value); if (value) setSubjectOnly(false); }} />
      </div>
      {outliers.length > 0 && <div className="warning-row"><TriangleAlert size={14} /><span>{outliers.length} exposure outlier{outliers.length === 1 ? "" : "s"} detected.</span></div>}
      {progress > 0 && progress < 100 && <ProgressBar value={progress} label={status} />}
      {status && <p className="workflow-status"><ShieldCheck size={13} />{status}</p>}
      <div className="consistency-actions"><button className="button primary" disabled={!primary?.average || !image} onClick={() => void applyCurrent()}>Apply to current</button><button className="button" disabled={!primary?.average || !image} onClick={() => void applyAlbum()}>Apply to album</button></div>
    </div>
  );
}
