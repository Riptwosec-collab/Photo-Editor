"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronLeft,
  Eraser,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { Adjustments, AiEditPlan, AdjustmentKey } from "@/features/editor/types";
import { useStudioStore } from "@/features/studio/store";
import { createLocalEditPlan } from "@/features/ai/local-provider";
import { PixelAnalysisPanel } from "./pixel-analysis-panel";
import { ProgressBar } from "@/components/ui/editor-controls";

const builtInSuggestions: Array<{
  id: string;
  name: string;
  confidence: number;
  area: string;
  changes: Partial<Adjustments>;
}> = [
  {
    id: "cinematic-grade",
    name: "Cinematic Color Grade",
    confidence: 92,
    area: "Global color",
    changes: { contrast: 16, highlights: -22, shadows: 12, temperature: -5, shadowSaturation: 14, highlightSaturation: 9, vignette: 14 },
  },
  {
    id: "skin-tones",
    name: "Enhance Skin Tones",
    confidence: 88,
    area: "Global warm tones",
    changes: { temperature: 5, tint: 3, orangeSaturation: 7, orangeLuminance: 5, texture: -5, clarity: -3 },
  },
  {
    id: "lift-shadows",
    name: "Lift Subject Shadows",
    confidence: 84,
    area: "Midtones and shadows",
    changes: { shadows: 24, shadowRecovery: 18, highlights: -10, exposure: 0.12 },
  },
  {
    id: "separation",
    name: "Add Subject Separation",
    confidence: 79,
    area: "Global contrast",
    changes: { clarity: 8, dehaze: 7, vignette: 18, midtoneContrast: 10 },
  },
];

export function AiAssistantPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const image = useEditorStore((state) => state.image);
  const adjustments = useEditorStore((state) => state.adjustments);
  const apply = useEditorStore((state) => state.applyAdjustments);
  const preview = useEditorStore((state) => state.previewAdjustment);
  const commit = useEditorStore((state) => state.commitAdjustments);
  const collapsed = useStudioStore((state) => state.assistantCollapsed);
  const setCollapsed = useStudioStore((state) => state.setAssistantCollapsed);
  const aiStatus = useStudioStore((state) => state.aiStatus);
  const aiProgress = useStudioStore((state) => state.aiProgress);
  const aiMessage = useStudioStore((state) => state.aiMessage);
  const setAiOperation = useStudioStore((state) => state.setAiOperation);
  const [prompt, setPrompt] = useState("Make this look more cinematic and enhance the skin tones while keeping the face natural.");
  const [plan, setPlan] = useState<AiEditPlan | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(builtInSuggestions.map((item) => [item.id, true])),
  );
  const [strength, setStrength] = useState<Record<string, number>>(
    Object.fromEntries(builtInSuggestions.map((item) => [item.id, 70])),
  );
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const previewSnapshot = useRef<Adjustments | null>(null);
  const cancelRef = useRef(0);

  const sceneTags = useMemo(() => {
    if (!image) return ["No image selected"];
    const tags = [image.height > image.width ? "Portrait orientation" : "Landscape orientation"];
    if (image.type.includes("jpeg")) tags.push("JPEG");
    if (image.type.includes("png")) tags.push("PNG");
    if (image.type.includes("webp")) tags.push("WebP");
    if (adjustments.exposure < -0.15 || adjustments.shadows > 18) tags.push("Low-light recovery");
    if (Math.abs(adjustments.temperature) > 8) tags.push("Color cast adjusted");

    return tags;
  }, [adjustments.exposure, adjustments.shadows, adjustments.temperature, image]);

  useEffect(() => () => { cancelRef.current++; }, []);

  async function generatePlan() {
    if (!image) { setError("Import an image before generating an edit plan."); return; }
    const token = ++cancelRef.current;
    setError(""); setPlan(null);
    setAiOperation("analyzing", 0, "Matching your prompt to local editing rules…");
    // Yield one frame so the UI can display the operation without simulated progress.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (cancelRef.current !== token) return;
    try {
      setPlan(createLocalEditPlan(prompt));
      setAiOperation("planned", 100, "Local plan ready for review");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Planning failed");
      setAiOperation("error", 0, "Planning failed");
    }
  }

  function cancelOperation() {
    cancelRef.current++;
    setAiOperation("cancelled", 0, "Operation cancelled");
  }

  function scaledChanges(changes: Partial<Adjustments>, value: number) {
    const scale = value / 100;
    return Object.fromEntries(
      Object.entries(changes).map(([key, target]) => [
        key,
        typeof target === "number"
          ? adjustments[key as AdjustmentKey] + (target - adjustments[key as AdjustmentKey]) * scale
          : target,
      ]),
    ) as Partial<Adjustments>;
  }

  function previewSuggestion(id: string) {
    const suggestion = builtInSuggestions.find((item) => item.id === id);
    if (!suggestion) return;
    if (activePreview === id && previewSnapshot.current) {
      for (const [key, value] of Object.entries(previewSnapshot.current)) {
        preview(key as AdjustmentKey, value);
      }
      previewSnapshot.current = null;
      setActivePreview(null);
      return;
    }
    if (previewSnapshot.current) {
      for (const [key, value] of Object.entries(previewSnapshot.current)) {
        preview(key as AdjustmentKey, value);
      }
    }
    previewSnapshot.current = { ...adjustments };
    const values = scaledChanges(suggestion.changes, strength[id]);
    for (const [key, value] of Object.entries(values)) preview(key as AdjustmentKey, Number(value));
    setActivePreview(id);
  }

  function applySuggestion(id: string) {
    const suggestion = builtInSuggestions.find((item) => item.id === id);
    if (!suggestion) return;
    if (activePreview === id) {
      commit();
      previewSnapshot.current = null;
      setActivePreview(null);
    } else {
      apply(scaledChanges(suggestion.changes, strength[id]));
    }
    onNotice(`${suggestion.name} applied`);
  }

  function applySelected() {
    const merged: Partial<Adjustments> = {};
    for (const suggestion of builtInSuggestions) {
      if (!selected[suggestion.id]) continue;
      Object.assign(merged, scaledChanges(suggestion.changes, strength[suggestion.id]));
    }
    if (plan) {
      for (const change of plan.changes) merged[change.key] = change.value;
    }
    apply(merged);
    onNotice("Selected AI suggestions applied as one undoable step");
  }

  if (collapsed) {
    return (
      <aside className="ai-assistant-panel collapsed" aria-label="AI Assistant collapsed">
        <button className="panel-rail-button" onClick={() => setCollapsed(false)} title="Open AI Assistant">
          <Bot size={18} />
          <span>AI</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="ai-assistant-panel" aria-label="AI Assistant">
      <header className="assistant-header">
        <div><span className="assistant-status-dot" /><div><strong>AI Assistant</strong><small>Local planning · Cloud provider offline</small></div></div>
        <div className="assistant-header-actions">
          <button title="Clear conversation" onClick={() => { setPlan(null); setError(""); setAiOperation("idle", 0, "Ready for local analysis"); }}><Eraser size={14} /></button>
          <button title="Collapse AI Assistant" onClick={() => setCollapsed(true)}><ChevronLeft size={15} /></button>
        </div>
      </header>

      <div className="assistant-scroll">
        <PixelAnalysisPanel onNotice={onNotice} />
        <section className="scene-understanding-card">
          <div className="assistant-section-title"><Sparkles size={14} /><strong>Image information</strong><span>LOCAL</span></div>
          <div className="scene-tags">{sceneTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <p>{image ? `Heuristic review of ${image.name}: ${image.width} × ${image.height}. No cloud vision or identity model has been used.` : "Import a photo to inspect file characteristics and build an explainable edit plan."}</p>
        </section>

        <section className="assistant-conversation">
          <div className="chat-bubble user"><span>You</span><p>{prompt}</p></div>
          <div className="chat-bubble assistant"><span><Bot size={12} /> LumaForge</span><p>{plan?.summary ?? "Describe the light or mood you want. I can suggest global, reversible adjustments using local prompt rules."}</p></div>
          <label className="prompt-composer">
            <textarea aria-label="AI editing prompt" maxLength={500} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            <button type="button" title="Generate edit plan" disabled={prompt.trim().length < 3 || aiStatus === "analyzing"} onClick={() => void generatePlan()}>
              {aiStatus === "analyzing" ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />}
            </button>
          </label>
          {error && <div className="inline-error"><TriangleAlert size={14} />{error}<button onClick={() => void generatePlan()}><RefreshCw size={13} /> Retry</button></div>}
          {aiStatus === "analyzing" && <div className="operation-card"><ProgressBar value={aiProgress} label={aiMessage} /><button className="text-button danger" onClick={cancelOperation}><X size={13} /> Cancel</button></div>}
        </section>

        <section className="assistant-suggestions">
          <div className="assistant-section-title"><SlidersHorizontal size={14} /><strong>Creative recipes</strong><span>{builtInSuggestions.length}</span></div>
          {builtInSuggestions.map((suggestion) => (
            <article className={`suggestion-item ${activePreview === suggestion.id ? "previewing" : ""}`} key={suggestion.id}>
              <div className="suggestion-select-row">
                <button className={`selection-check ${selected[suggestion.id] ? "selected" : ""}`} aria-label={`Select ${suggestion.name}`} aria-pressed={selected[suggestion.id]} onClick={() => setSelected((state) => ({ ...state, [suggestion.id]: !state[suggestion.id] }))}>{selected[suggestion.id] && <Check size={12} />}</button>
                <div><strong>{suggestion.name}</strong><small>{suggestion.area}</small></div>
                <span className="confidence-chip">Recipe</span>
              </div>
              <label className="suggestion-strength"><span>Strength</span><input type="range" min="0" max="100" value={strength[suggestion.id]} onChange={(event) => setStrength((state) => ({ ...state, [suggestion.id]: Number(event.target.value) }))} /><output>{strength[suggestion.id]}</output></label>
              <div className="suggestion-actions"><button disabled={!image} onClick={() => previewSuggestion(suggestion.id)}>{activePreview === suggestion.id ? "Cancel preview" : "Preview"}</button><button className="apply" disabled={!image} onClick={() => applySuggestion(suggestion.id)}>Apply</button></div>
            </article>
          ))}
        </section>

        {plan && (
          <section className="generated-plan-card">
            <div className="assistant-section-title"><Bot size={14} /><strong>Generated Plan</strong><span>{plan.changes.length} changes</span></div>
            <ul>{plan.changes.map((change) => <li key={change.key}><span>{change.key}</span><b>{change.value > 0 ? "+" : ""}{change.value}</b><small>{change.reason}</small></li>)}</ul>
            {plan.warnings.map((warning) => <p className="plan-warning" key={warning}><TriangleAlert size={13} />{warning}</p>)}
          </section>
        )}

        <section className="quality-card"><div className="protection-grid"><span><ShieldCheck size={14} /> Original unchanged</span><span><ShieldCheck size={14} /> Undoable adjustments</span></div><p>Recipes change the whole image. Face recognition, selective retouching and generative AI require a connected provider.</p></section>
      </div>

      <footer className="assistant-footer">
        <button className="assistant-secondary" onClick={() => { setPlan(null); onNotice("Generated plan cleared"); }}><X size={14} /> Clear plan</button>
        <button className="assistant-primary" disabled={!image} onClick={applySelected}><Sparkles size={14} /> Apply selected</button>
      </footer>
    </aside>
  );
}
