"use client";
import { RotateCcw } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
import type { AdjustmentKey } from "@/features/editor/types";
import { Histogram } from "./histogram";
import { ColorMixer } from "./color-mixer";
const groups=[
 ["Light",[["exposure","Exposure",-2,2,.01],["contrast","Contrast",-100,100,1],["highlights","Highlights",-100,100,1],["shadows","Shadows",-100,100,1],["whites","Whites",-100,100,1],["blacks","Blacks",-100,100,1]]],
 ["Color",[["temperature","Temperature",-100,100,1],["tint","Tint",-100,100,1],["vibrance","Vibrance",-100,100,1],["saturation","Saturation",-100,100,1]]],
 ["Detail & Effects",[["clarity","Clarity",-100,100,1],["sharpness","Sharpness",0,100,1],["noiseReduction","Noise reduction",0,100,1],["vignette","Vignette",0,100,1],["grain","Grain",0,100,1]]]
] as const;
export function AdjustmentPanel(){const adjustments=useEditorStore(s=>s.adjustments);const preview=useEditorStore(s=>s.previewAdjustment);const commit=useEditorStore(s=>s.commitAdjustments);const reset=useEditorStore(s=>s.reset);
 return <div className="panel-scroll"><Histogram/><div className="panel-title"><div><span className="kicker">Manual</span><h2>Adjustments</h2></div><button className="icon-button" title="Reset all adjustments" onClick={reset}><RotateCcw size={16}/></button></div>{groups.map(([title,controls])=><section className="control-group" key={title}><h3>{title}</h3>{controls.map(([key,label,min,max,step])=>{const typed=key as AdjustmentKey;return <label className="slider-row" key={key}><span><b>{label}</b><output>{adjustments[typed].toFixed(step<1?2:0)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={adjustments[typed]} onChange={e=>preview(typed,Number(e.target.value))} onPointerUp={commit} onKeyUp={commit}/></label>})}</section>)}<ColorMixer/></div>}
