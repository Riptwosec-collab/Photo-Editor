"use client";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/features/editor/store";
import { useStudioStore } from "@/features/studio/store";
import { drawMask } from "@/features/render/layers";
import { T, useT } from "@/features/i18n/text";
import type { EditorLayer } from "@/features/editor/types";
export function RefineTools({layer}:{layer:EditorLayer}) {
 const t=useT(),canvas=useRef<HTMLCanvasElement>(null);
 const [background,setBackground]=useState("#111111");
 const [error,setError]=useState("");
 const update=(patch:Partial<EditorLayer>)=>useEditorStore.getState().updateLayer(layer.id,patch);
 useEffect(()=>{if(canvas.current)void drawMask(canvas.current,layer.mask).catch(()=>setError("Could not draw mask"));},[layer.mask]);
 const transform=layer.transform??{x:0,y:0,scale:1,rotation:0};
 return <div className="refine-tools">
 {layer.kind!=="adjustment"&&<details><summary><T text="Transform layer"/></summary>
 <p><T text="Drag the on-image controls or use arrow keys. Release to commit one undo step."/></p>
 {(["x","y","scale","rotation"] as const).map(key=><label key={key}>{t(key)}<input aria-label={`Transform ${key}`} type="range" min={key==="scale"?.1:key==="rotation"?-180:-1} max={key==="scale"?4:key==="rotation"?180:1} step={key==="rotation"?1:.01} value={transform[key]} onChange={e=>update({transform:{...transform,[key]:+e.target.value}})}/></label>)}
 <button onClick={()=>{useEditorStore.getState().setMaskEditing(false);useStudioStore.getState().setCompareMode("off");}}><T text="Transform on image"/></button><button onClick={()=>update({transform:undefined})}><T text="Reset transform"/></button></details>}
 <details><summary><T text="Refine mask edges"/></summary><p><T text="Soft edge controls preserve partial coverage. Use a brush to restore or erase individual strands."/></p>
 <label><T text="Mask preview background"/><select value={background} onChange={e=>setBackground(e.target.value)}><option value="#111111">{t("Black")}</option><option value="#ffffff">{t("White")}</option><option value="checker">{t("Checkerboard")}</option></select></label>
 <div className="mask-preview" style={{background:background==="checker"?"repeating-conic-gradient(#999 0% 25%,#eee 0% 50%) 0 / 16px 16px":background}}><canvas ref={canvas} width={300} height={200} aria-label={t("Refined mask preview")}/></div>
 {(["edgeShift","edgeContrast","feather"] as const).map(key=><label key={key}><T text={{edgeShift:"Edge shift",edgeContrast:"Edge contrast",feather:"Feather"}[key]}/><input aria-label={key} type="range" min={key==="edgeShift"?-1:0} max="1" step=".01" value={layer.mask[key]??0} onChange={e=>update({mask:{...layer.mask,[key]:+e.target.value}})}/></label>)}
 <button onClick={async()=>{try{const mask=document.createElement("canvas");const image=useEditorStore.getState().image;const preview=document.querySelector<HTMLCanvasElement>('[aria-label="Edited image preview"]');const width=preview?.width||image?.width||1000;const height=preview?.height||image?.height||1000;const factor=Math.min(1,1200/Math.max(width,height));mask.width=Math.max(1,Math.round(width*factor));mask.height=Math.max(1,Math.round(height*factor));await drawMask(mask,layer.mask);update({mask:{...layer.mask,kind:"brush",dataUrl:mask.toDataURL("image/png"),strokes:[],invert:false,feather:0,edgeShift:0,edgeContrast:0}});mask.width=mask.height=0;useEditorStore.getState().setMaskEditing(true);useStudioStore.getState().setCompareMode("off");}catch{setError("Could not draw mask");}}}><T text="Refine with brush"/></button>
 {layer.kind==="raster"&&<label><T text="Remove edge color spill"/><input aria-label="Remove edge color spill" type="range" min="0" max="1" step=".05" value={layer.decontaminate??0} onChange={e=>update({decontaminate:+e.target.value})}/></label>}
 </details>
 {layer.kind==="adjustment"&&<details><summary><T text="Replace selected color"/></summary><p><T text="Apply color through this layer mask while retaining light and texture. Select sky with AI or paint the area manually."/></p>
 <label><T text="Replacement color"/><input aria-label="Replacement color" type="color" value={layer.colorReplace?.color??"#4993ff"} onChange={e=>update({colorReplace:{color:e.target.value,strength:layer.colorReplace?.strength??1}})}/></label>
 <label><T text="Color strength"/><input aria-label="Color strength" type="range" min="0" max="1" step=".01" value={layer.colorReplace?.strength??0} onChange={e=>update({colorReplace:{color:layer.colorReplace?.color??"#4993ff",strength:+e.target.value}})}/></label>
 <button onClick={()=>update({colorReplace:undefined})}><T text="Reset color replacement"/></button></details>}
 {error&&<p role="status">{t(error)}</p>}
 </div>;
}
