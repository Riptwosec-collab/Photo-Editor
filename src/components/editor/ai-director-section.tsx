"use client";
import { T } from "@/features/i18n/text";


import { useEffect, useRef, useState } from "react";
import {
  Check,
  CircleCheck,
  LoaderCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import { analyzeImage, type PixelAnalysis } from "@/features/ai/pixel-analysis";
import { DIRECTOR_RECIPES, scaleRecipe } from "@/features/editor/intelligence";
import { useStudioStore, type DirectorDirection } from "@/features/studio/store";
import { ProgressBar, SegmentedControl } from "@/components/ui/editor-controls";

const directions: Array<{ value: DirectorDirection; label: string }> = [
  { value: "natural", label: "Natural" },
  { value: "premium", label: "Premium" },
  { value: "cinematic", label: "Cinematic" },
  { value: "dramatic", label: "Dramatic" },
];

const steps = [
  { id: "lighting", name: "Correct mixed lighting", detail: "Balance white point and tonal endpoints", enabled: true },
  { id: "shadows", name: "Lift image shadows", detail: "Recover detail without flattening contrast", enabled: true },
  { id: "skin", name: "Adjust orange tones", detail: "Limit warmth and preserve texture", enabled: true },
  { id: "remove", name: "Remove distracting background sign", detail: "Requires a connected generative provider", enabled: false },
  { id: "separation", name: "Increase tonal separation", detail: "Presence, dehaze and vignette", enabled: true },
  { id: "grade", name: "Apply creative color grade", detail: "Direction-aware split tone", enabled: true },
  { id: "crop", name: "Optimize for Instagram 4:5", detail: "Non-destructive centered crop", enabled: true },
] as const;

export function AiDirectorSection({ onNotice }: { onNotice: (message: string) => void }) {
  const image = useEditorStore((state) => state.image);
  const adjustments = useEditorStore((state) => state.adjustments);
  const restore = useEditorStore((state) => state.restoreSnapshot);
  const direction = useStudioStore((state) => state.directorDirection);
  const setDirection = useStudioStore((state) => state.setDirectorDirection);
  const status = useStudioStore((state) => state.aiStatus);
  const progress = useStudioStore((state) => state.aiProgress);
  const message = useStudioStore((state) => state.aiMessage);
  const setOperation = useStudioStore((state) => state.setAiOperation);
  const [intensity, setIntensity] = useState(72);
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(steps.map((step) => [step.id, step.enabled])),
  );
  const [planVisible, setPlanVisible] = useState(false);
  const runToken = useRef(0);
  const [measurement, setMeasurement] = useState<{ url: string; result: PixelAnalysis } | null>(null);
  useEffect(() => () => { runToken.current += 1; }, []);

  async function analyze() {
    if (!image) {
      setOperation("error", 0, "Import an image before analysis");
      return;
    }
    const token = runToken.current + 1;
    runToken.current = token;
    setPlanVisible(false);
    setOperation("analyzing", 5, "Sampling current tonal and color state…");
    try {
      const result = await analyzeImage(image.objectUrl);
      if (runToken.current !== token || useEditorStore.getState().image?.objectUrl !== image.objectUrl) return;
      setMeasurement({ url: image.objectUrl, result });
      setOperation("planned", 100, "Plan ready");
      setPlanVisible(true);
    } catch (error) {
      if (runToken.current === token) setOperation("error", 0, error instanceof Error ? error.message : "Analysis failed");
    }
  }

  function cancel() {
    runToken.current += 1;
    setOperation("cancelled", 0, "Analysis cancelled");
  }

  async function applyPlan() {
    if (!image) return;
    const measured = measurement?.url === image.objectUrl ? measurement.result.changes : {};
    const recipe = { ...DIRECTOR_RECIPES[direction], ...measured };
    if (!selected.lighting) {
      delete recipe.exposure;
      delete recipe.temperature;
      delete recipe.tint;
      delete recipe.highlights;
      delete recipe.whites;
      delete recipe.blacks;
    }
    if (!selected.shadows) {
      delete recipe.shadows;
      delete recipe.shadowRecovery;
    }
    if (!selected.skin) {
      delete recipe.texture;
      delete recipe.orangeLuminance;
    }
    if (!selected.separation) {
      delete recipe.clarity;
      delete recipe.dehaze;
      delete recipe.vignette;
    }
    if (!selected.grade) {
      delete recipe.shadowSaturation;
      delete recipe.highlightSaturation;
      delete recipe.grain;
    }
    const current = useEditorStore.getState();
    restore({ adjustments: { ...adjustments, ...scaleRecipe(adjustments, recipe, intensity) }, geometry: { ...current.geometry, ...(selected.crop ? { aspectRatio: "4:5" as const } : {}) }, layers: current.layers });
    setOperation("completed", 100, "Director edit completed");
    onNotice(`AI Director ${direction} plan applied as one undoable edit`);
  }

  return (
    <div className="ai-director-workflow">
      <div className="director-steps" aria-label="AI Director workflow">
        {["Analyze", "Plan", "Edit"].map((label, index) => {
          const active = status === "analyzing" ? index === 0 : status === "planned" ? index <= 1 : status === "applying" || status === "completed" ? true : false;
          return <span key={label} className={active ? "active" : ""}><b>{index + 1}</b>{label}</span>;
        })}
      </div>

      {measurement && measurement.url === image?.objectUrl && <p className="muted">Mean luminance: {measurement?.result.luminance.toFixed(1)} / 255 · {measurement?.result.samples.toLocaleString()} samples</p>}
      <SegmentedControl value={direction} options={directions} onChange={setDirection} ariaLabel="Creative direction" />

      <label className="compact-slider-label"><span> <T text={"Plan intensity"} /> </span><output>{intensity}%</output><input type="range" min="0" max="100" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label>

      {(status === "analyzing" || status === "applying") && (
        <div className="operation-card">
          <div className="analysis-wave" aria-hidden="true"><span /><span /><span /><span /><span /></div>
          <ProgressBar value={progress} label={message} />
          <button className="text-button danger" onClick={cancel}><X size={13} /> <T text={"Cancel"} /> </button>
        </div>
      )}

      {status === "error" && <div className="inline-error"><TriangleAlert size={14} />{message}<button onClick={() => void analyze()}><RefreshCw size={13} /> <T text={"Retry"} /> </button></div>}

      {(planVisible || status === "planned" || status === "completed") && (
        <div className="director-plan-list">
          <div className="plan-summary"><div><Sparkles size={15} /><strong>{direction[0].toUpperCase() + direction.slice(1)} edit plan</strong></div><span>{steps.filter((step) => selected[step.id] && step.enabled).length} <T text={"changes"} /> </span></div>
          {steps.map((step) => (
            <button
              type="button"
              key={step.id}
              className={`director-plan-step ${selected[step.id] ? "selected" : ""} ${!step.enabled ? "disabled" : ""}`}
              disabled={!step.enabled}
              onClick={() => setSelected((state) => ({ ...state, [step.id]: !state[step.id] }))}
            >
              <span className="selection-check">{selected[step.id] && step.enabled ? <Check size={12} /> : !step.enabled ? <TriangleAlert size={12} /> : null}</span>
              <span><strong>{step.name}</strong><small>{step.detail}</small></span>
            </button>
          ))}
          <div className="identity-protection-row"><ShieldCheck size={14} /><span>Global pixel analysis and recipe adjustments. Use Layers & Masks for local edits.</span></div>
        </div>
      )}

      <div className="director-actions">
        <button className="button" onClick={() => void analyze()} disabled={status === "analyzing" || status === "applying"}>{status === "analyzing" ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />} <T text={"Analyze"} /> </button>
        <button className="button" onClick={() => setPlanVisible(true)} disabled={status !== "planned" && !planVisible}><CircleCheck size={15} /> <T text={"Review plan"} /> </button>
        <button className="button primary" onClick={() => void applyPlan()} disabled={!image || status === "analyzing" || status === "applying"}><Sparkles size={15} /> <T text={"Apply selected"} /> </button>
      </div>
    </div>
  );
}
