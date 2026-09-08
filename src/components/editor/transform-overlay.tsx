"use client";
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/features/editor/store";
import type { EditorLayer } from "@/features/editor/types";
import { useT } from "@/features/i18n/text";
const neutral = { x: 0, y: 0, scale: 1, rotation: 0 };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export function TransformOverlay() {
  const t = useT();
  const layer = useEditorStore(s => s.layers.find(l => l.id === s.activeLayerId));
  const [preview, setPreview] = useState<EditorLayer["transform"]>();
  const gesture = useRef<{x:number;y:number;rect:DOMRect;value:typeof neutral;mode:string;next:typeof neutral}|null>(null);
  useEffect(()=>()=>{if(gesture.current)useEditorStore.getState().cancelLayerPreview();},[]);
  if (!layer || layer.locked || !["text", "raster"].includes(layer.kind)) return null;
  const value = preview ?? layer.transform ?? neutral;
  function finish(commit: boolean) {
    const g = gesture.current; gesture.current = null;
    if (g && commit && JSON.stringify(g.next)!==JSON.stringify(g.value)) useEditorStore.getState().updateLayer(layer!.id,{transform:g.next});
    if(g && !commit) useEditorStore.getState().cancelLayerPreview();
    setPreview(undefined);
  }
  return <div className="transform-overlay" aria-label={t("Transform selected layer")} onDoubleClick={e=>e.stopPropagation()}>
    <div className="transform-outline" style={{transform:`translate(${value.x*100}%,${value.y*100}%) rotate(${value.rotation}deg) scale(${value.scale})`}} />
    {(Math.abs(value.x)<.01 || Math.abs(value.y)<.01) && <div className="transform-center-guides" />}
    <div className="transform-handles">{["Move layer","Scale layer","Rotate layer"].map((mode,index)=><button key={mode} aria-label={t(mode)}
      onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);const rect=e.currentTarget.closest(".transform-overlay")!.getBoundingClientRect();gesture.current={x:e.clientX,y:e.clientY,rect,value,mode,next:value};}}
      onPointerMove={e=>{e.stopPropagation();const g=gesture.current;if(!g||!e.currentTarget.hasPointerCapture(e.pointerId))return;const dx=(e.clientX-g.x)/g.rect.width,dy=(e.clientY-g.y)/g.rect.height;
        const snap=(n:number)=>Math.abs(n)<.015?0:clamp(n,-1,1);
        const next=index===0?{...g.value,x:snap(g.value.x+dx),y:snap(g.value.y+dy)}:index===1?{...g.value,scale:clamp(g.value.scale+dx*2-dy*2,.1,4)}:{...g.value,rotation:clamp(g.value.rotation+dx*180,-180,180)};
        g.next=next;setPreview(next);useEditorStore.getState().previewLayer(layer.id,{transform:next});
      }} onPointerUp={e=>{e.stopPropagation();finish(true);}} onPointerCancel={()=>finish(false)}
      onKeyDown={e=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;e.preventDefault();const amount=["ArrowLeft","ArrowDown"].includes(e.key)?-1:1;useEditorStore.getState().updateLayer(layer.id,{transform:index===0?{...value,[e.key.includes("Left")||e.key.includes("Right")?"x":"y"]:clamp(value[e.key.includes("Left")||e.key.includes("Right")?"x":"y"]+amount*.01,-1,1)}:index===1?{...value,scale:clamp(value.scale+amount*.05,.1,4)}:{...value,rotation:clamp(value.rotation+amount,-180,180)}});}}
    >{t(mode)}</button>)}</div>
    <output>{Math.round(value.scale*100)}% · {Math.round(value.rotation)}°</output>
  </div>;
}
