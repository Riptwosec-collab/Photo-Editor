"use client";

import { useState } from "react";
import {
  Aperture,
  ChevronRight,
  CircleDot,
  Crop,
  Database,
  Focus,
  Gauge,
  ImageUp,
  Info,
  Layers3,
  PanelRightClose,
  ScanSearch,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tags,
  WandSparkles,
} from "lucide-react";
import { AccordionSection, AdjustmentSlider, Toggle } from "@/components/ui/editor-controls";
import { AiDirectorSection } from "./ai-director-section";
import { AutoEnhanceSection } from "./auto-enhance-section";
import { ColorConsistencySection, ReversePresetSection } from "./reference-workflows";
import { ColorMixer } from "./color-mixer";
import { GeometryPanel } from "./geometry-panel";
import { Histogram } from "./histogram";
import { ToneCurvePanel } from "./tone-curve-panel";
import { VersionPanel } from "./version-panel";
import { useEditorStore } from "@/features/editor/store";
import { useStudioStore } from "@/features/studio/store";

const lightKeys = [
  "exposure",
  "contrast",
  "highlights",
  "shadows",
  "whites",
  "blacks",
  "brightness",
  "gamma",
  "dynamicRange",
  "midtoneContrast",
  "highlightRecovery",
  "shadowRecovery",
] as const;

export function ProInspector({
  projectId,
  onNotice,
}: {
  projectId: string | null;
  onNotice: (message: string) => void;
}) {
  const image = useEditorStore((state) => state.image);
  const resetSection = useEditorStore((state) => state.resetSection);
  const collapsed = useStudioStore((state) => state.inspectorCollapsed);
  const setCollapsed = useStudioStore((state) => state.setInspectorCollapsed);
  const activeSection = useStudioStore((state) => state.activeInspectorSection);
  const maskOverlayVisible = useStudioStore((state) => state.maskOverlayVisible);
  const toggleCanvasFlag = useStudioStore((state) => state.toggleCanvasFlag);
  const [maskTool, setMaskTool] = useState<"linear" | "radial" | "brush" | "subject">("radial");

  if (collapsed) {
    return (
      <aside className="professional-inspector collapsed" aria-label="Editing inspector collapsed">
        <button className="panel-rail-button" onClick={() => setCollapsed(false)} title="Open Editing Inspector"><SlidersHorizontal size={18} /><span>Edit</span></button>
      </aside>
    );
  }

  return (
    <aside className="professional-inspector" aria-label="Editing inspector">
      <header className="inspector-header">
        <div><span className="inspector-status-dot" /><div><strong>Editing Inspector</strong><small>Shared non-destructive recipe</small></div></div>
        <button title="Collapse inspector" onClick={() => setCollapsed(true)}><PanelRightClose size={15} /></button>
      </header>
      <div className="inspector-scroll">
        <AccordionSection id="histogram" title="Histogram" subtitle="RGB + luminance · live" icon={<Gauge size={15} />} defaultOpen forceOpen={activeSection === "histogram"}>
          <Histogram />
        </AccordionSection>

        <AccordionSection id="ai-director" title="AI Director Mode" subtitle="Analyze · Plan · Edit" icon={<WandSparkles size={15} />} badge="AI" defaultOpen forceOpen={activeSection === "ai-director"}>
          <AiDirectorSection onNotice={onNotice} />
        </AccordionSection>

        <AccordionSection id="auto-enhance" title="AI Auto Enhance" subtitle="Nine goal-aware modes" icon={<Sparkles size={15} />} badge="AI" forceOpen={activeSection === "auto-enhance"}>
          <AutoEnhanceSection onNotice={onNotice} />
        </AccordionSection>

        <AccordionSection id="reverse-preset" title="Reverse Preset Generator" subtitle="Reference image to reusable recipe" icon={<ImageUp size={15} />} badge="AI" forceOpen={activeSection === "reverse-preset"}>
          <ReversePresetSection onNotice={onNotice} />
        </AccordionSection>

        <AccordionSection id="color-consistency" title="Color Consistency" subtitle="Cross-photo reference matching" icon={<ScanSearch size={15} />} badge="AI" forceOpen={activeSection === "color-consistency"}>
          <ColorConsistencySection onNotice={onNotice} />
        </AccordionSection>

        <AccordionSection
          id="light"
          title="Light"
          subtitle="Professional tonal controls"
          icon={<Sun size={15} />}
          defaultOpen
          forceOpen={activeSection === "light"}
          actions={<button className="mini-reset" title="Reset Light" onClick={() => resetSection([...lightKeys])}>Reset</button>}
        >
          <AdjustmentSlider adjustment="exposure" label="Exposure" min={-2} max={2} step={0.01} unit="EV" />
          <AdjustmentSlider adjustment="contrast" label="Contrast" min={-100} max={100} />
          <AdjustmentSlider adjustment="highlights" label="Highlights" min={-100} max={100} />
          <AdjustmentSlider adjustment="shadows" label="Shadows" min={-100} max={100} />
          <AdjustmentSlider adjustment="whites" label="Whites" min={-100} max={100} />
          <AdjustmentSlider adjustment="blacks" label="Blacks" min={-100} max={100} />
          <AdjustmentSlider adjustment="brightness" label="Brightness" min={-100} max={100} />
          <AdjustmentSlider adjustment="gamma" label="Gamma" min={-100} max={100} />
          <AdjustmentSlider adjustment="dynamicRange" label="Dynamic Range" min={-100} max={100} />
          <AdjustmentSlider adjustment="midtoneContrast" label="Midtone Contrast" min={-100} max={100} />
          <AdjustmentSlider adjustment="highlightRecovery" label="Highlight Recovery" min={0} max={100} />
          <AdjustmentSlider adjustment="shadowRecovery" label="Shadow Recovery" min={0} max={100} />
        </AccordionSection>

        <AccordionSection id="color" title="Color / HSL" subtitle="White balance and eight color ranges" icon={<CircleDot size={15} />} forceOpen={activeSection === "color"}>
          <AdjustmentSlider adjustment="temperature" label="Temperature" min={-100} max={100} />
          <AdjustmentSlider adjustment="tint" label="Tint" min={-100} max={100} />
          <AdjustmentSlider adjustment="vibrance" label="Vibrance" min={-100} max={100} />
          <AdjustmentSlider adjustment="saturation" label="Saturation" min={-100} max={100} />
          <ColorMixer />
        </AccordionSection>

        <AccordionSection id="tone-curve" title="Tone Curve" subtitle="Editable RGB composite" icon={<Aperture size={15} />} forceOpen={activeSection === "tone-curve"}>
          <ToneCurvePanel embedded />
        </AccordionSection>

        <AccordionSection id="color-grading" title="Color Grading" subtitle="Shadows · Midtones · Highlights" icon={<CircleDot size={15} />} forceOpen={activeSection === "color-grading"}>
          <div className="grading-wheel-row"><span className="grading-wheel shadow" style={{ "--wheel-hue": "var(--shadow-hue, 220deg)" } as React.CSSProperties} /><div><strong>Shadows</strong><small>Hue and saturation</small></div></div>
          <AdjustmentSlider adjustment="shadowHue" label="Shadow Hue" min={0} max={360} unit="°" />
          <AdjustmentSlider adjustment="shadowSaturation" label="Shadow Saturation" min={0} max={100} />
          <div className="grading-wheel-row"><span className="grading-wheel midtone" /><div><strong>Midtones</strong><small>Hue and saturation</small></div></div>
          <AdjustmentSlider adjustment="midtoneHue" label="Midtone Hue" min={0} max={360} unit="°" />
          <AdjustmentSlider adjustment="midtoneSaturation" label="Midtone Saturation" min={0} max={100} />
          <div className="grading-wheel-row"><span className="grading-wheel highlight" /><div><strong>Highlights</strong><small>Hue and saturation</small></div></div>
          <AdjustmentSlider adjustment="highlightHue" label="Highlight Hue" min={0} max={360} unit="°" />
          <AdjustmentSlider adjustment="highlightSaturation" label="Highlight Saturation" min={0} max={100} />
          <AdjustmentSlider adjustment="gradingBalance" label="Balance" min={-100} max={100} />
        </AccordionSection>

        <AccordionSection id="detail" title="Detail" subtitle="Texture, sharpening and denoise" icon={<Focus size={15} />} forceOpen={activeSection === "detail"}>
          <AdjustmentSlider adjustment="texture" label="Texture" min={-100} max={100} />
          <AdjustmentSlider adjustment="clarity" label="Clarity" min={-100} max={100} />
          <AdjustmentSlider adjustment="dehaze" label="Dehaze" min={-100} max={100} />
          <AdjustmentSlider adjustment="sharpness" label="Sharpness" min={0} max={100} />
          <AdjustmentSlider adjustment="noiseReduction" label="Noise Reduction" min={0} max={100} />
        </AccordionSection>

        <AccordionSection id="effects" title="Effects" subtitle="Vignette and grain" icon={<Sparkles size={15} />} forceOpen={activeSection === "effects"}>
          <AdjustmentSlider adjustment="vignette" label="Vignette" min={0} max={100} />
          <AdjustmentSlider adjustment="grain" label="Grain" min={0} max={100} />
        </AccordionSection>

        <AccordionSection id="lens" title="Lens" subtitle="Profile-aware corrections" icon={<Aperture size={15} />} forceOpen={activeSection === "lens"}>
          <Toggle checked={false} onChange={() => undefined} disabled label="Auto lens profile" description="Requires camera and lens profile metadata" />
          <Toggle checked={false} onChange={() => undefined} disabled label="Remove chromatic aberration" description="Requires the WebGL lens-correction shader" />
          <p className="capability-note"><Info size={13} />Controls remain disabled instead of reporting a correction that was not performed.</p>
        </AccordionSection>

        <AccordionSection id="geometry" title="Geometry" subtitle="Crop, straighten and perspective" icon={<Crop size={15} />} forceOpen={activeSection === "geometry"}>
          <GeometryPanel embedded />
        </AccordionSection>

        <AccordionSection id="masking" title="Masking" subtitle="Local selection preview" icon={<Layers3 size={15} />} badge="PARTIAL" forceOpen={activeSection === "masking"}>
          <div className="mask-tool-grid">
            {(["linear", "radial", "brush", "subject"] as const).map((tool) => <button key={tool} className={maskTool === tool ? "active" : ""} onClick={() => { setMaskTool(tool); if (!maskOverlayVisible) toggleCanvasFlag("maskOverlayVisible"); }}>{tool}</button>)}
          </div>
          <Toggle label="Show mask overlay" description="Displays the selected local preview on canvas" checked={maskOverlayVisible} onChange={() => toggleCanvasFlag("maskOverlayVisible")} />
          <p className="capability-note"><Info size={13} />Overlay interaction is functional. Per-pixel local adjustment compositing is not yet represented as complete.</p>
        </AccordionSection>

        <AccordionSection id="metadata" title="Metadata" subtitle="File and project information" icon={<Tags size={15} />} forceOpen={activeSection === "metadata"}>
          <dl className="metadata-list">
            <div><dt>Filename</dt><dd>{image?.name ?? "—"}</dd></div>
            <div><dt>File type</dt><dd>{image?.rawType ?? image?.type ?? "—"}</dd></div>
            <div><dt>Resolution</dt><dd>{image ? `${image.width} × ${image.height}` : "—"}</dd></div>
            <div><dt>Size</dt><dd>{image ? `${(image.size / 1024 / 1024).toFixed(2)} MB` : "—"}</dd></div>
            <div><dt>Camera</dt><dd>{image?.camera ?? "Not embedded"}</dd></div>
            <div><dt>ISO</dt><dd>{image?.iso ?? "—"}</dd></div>
            <div><dt>Aperture</dt><dd>{image?.aperture ?? "—"}</dd></div>
            <div><dt>Focal length</dt><dd>{image?.focalLength ?? "—"}</dd></div>
            <div><dt>Shutter</dt><dd>{image?.shutterSpeed ?? "—"}</dd></div>
          </dl>
        </AccordionSection>

        <AccordionSection id="versions" title="Version History" subtitle="Snapshots, duplicate and branch" icon={<Database size={15} />} forceOpen={activeSection === "versions"}>
          <VersionPanel projectId={projectId} embedded />
        </AccordionSection>
      </div>
      <footer className="inspector-footer"><span>Shared renderer</span><ChevronRight size={13} /><span>Non-destructive</span></footer>
    </aside>
  );
}
