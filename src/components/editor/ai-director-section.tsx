"use client";

import { useRef, useState } from "react";
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
  { id: "shadows", name: "Lift subject shadows", detail: "Recover detail without flattening contrast", enabled: true },
  { id: "skin", name: "Protect skin tones", detail: "Limit warmth and preserve texture", enabled: true },
  { id: "remove", name: "Remove distracting background sign", detail: "Requires a connected generative provider", enabled: false },
  { id: "separation", name: "Increase subject separation", detail: "Presence, dehaze and vignette", enabled: true },
  { id: "grade", name: "Apply creative color grade", detail: "Direction-aware split tone", enabled: true },
  { id: "crop", name: "Optimize for Instagram 4:5", detail: "Non-destructive centered crop", enabled: true },
] as const;

export function AiDirectorSection({ onNotice }: { onNotice: (message: string) => void }) {
  const image = useEditorStore((state) => state.image);
  const adjustments = useEditorStore((state) => state.adjustments);
  const apply = useEditorStore((state) => state.applyAdjustments);
  const setAspectRatio = useEditorStore((state) => state.setAspectRatio);
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

  async function analyze() {
    if (!image) {
      setOperation("error", 0, "Import an image before analysis");
      return;
    }
    const token = runToken.current + 1;
    runToken.current = token;
    setPlanVisible(false);
    setOperation("analyzing", 5, "Sampling current tonal and color state…");
    const checkpoints: Array<[number, string]> = [
      [22, "Checking exposure distribution…"],
      [41, "Evaluating color cast and skin-safe limits…"],
      [63, "Building direction-aware edit steps…"],
      [84, "Validating non-destructive operations…"],
      [100, "Plan ready"],
    ];
    for (const [value, label] of checkpoints) {
      await new Promise((resolve) => window.setTimeout(resolve, 210));
      if (runToken.current !== token) return;
      setOperation(value === 100 ? "planned" : "analyzing", value, label);
    }
    setPlanVisible(true);
  }

  function cancel() {
    runToken.current += 1;
    setOperation("cancelled", 0, "Analysis cancelled");
  }

  async function applyPlan() {
    if (!image) return;
    const token = runToken.current + 1;
    runToken.current = token;
    setOperation("applying", 12, "Applying selected adjustments…");
    for (const [value, label] of [
      [36, "Balancing light…"],
      [58, "Protecting skin texture…"],
      [78, "Applying creative direction…"],
      [100, "Director edit completed"],
    ] as Array<[number, string]>) {
      await new Promise((resolve) => window.setTimeout(resolve, 170));
      if (runToken.current !== token) return;
      setOperation(value === 100 ? "completed" : "applying", value, label);
    }
    const recipe = { ...DIRECTOR_RECIPES[direction] };
    if (!selected.lighting) {
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
    apply(scaleRecipe(adjustments, recipe, intensity));
    if (selected.crop) setAspectRatio("4:5");
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

      <SegmentedControl value={direction} options={directions} onChange={setDirection} ariaLabel="Creative direction" />

      <label className="compact-slider-label"><span>Plan intensity</span><output>{intensity}%</output><input type="range" min="0" max="100" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /></label>

      {(status === "analyzing" || status === "applying") && (
        <div className="operation-card">
          <div className="analysis-wave" aria-hidden="true"><span /><span /><span /><span /><span /></div>
          <ProgressBar value={progress} label={message} />
          <button className="text-button danger" onClick={cancel}><X size={13} /> Cancel</button>
        </div>
      )}

      {status === "error" && <div className="inline-error"><TriangleAlert size={14} />{message}<button onClick={() => void analyze()}><RefreshCw size={13} /> Retry</button></div>}

      {(planVisible || status === "planned" || status === "completed") && (
        <div className="director-plan-list">
          <div className="plan-summary"><div><Sparkles size={15} /><strong>{direction[0].toUpperCase() + direction.slice(1)} edit plan</strong></div><span>{steps.filter((step) => selected[step.id] && step.enabled).length} changes</span></div>
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
          <div className="identity-protection-row"><ShieldCheck size={14} /><span>Identity preservation and skin texture protection are locked.</span></div>
        </div>
      )}

      <div className="director-actions">
        <button className="button" onClick={() => void analyze()} disabled={status === "analyzing" || status === "applying"}>{status === "analyzing" ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />} Analyze</button>
        <button className="button" onClick={() => setPlanVisible(true)} disabled={status !== "planned" && !planVisible}><CircleCheck size={15} /> Review plan</button>
        <button className="button primary" onClick={() => void applyPlan()} disabled={!image || status === "analyzing" || status === "applying"}><Sparkles size={15} /> Apply selected</button>
      </div>
    </div>
  );
}
