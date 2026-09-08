"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useEditorStore } from "@/features/editor/store";
import { drawMask } from "@/features/render/layers";
import type { MaskStroke } from "@/features/editor/types";
export function MaskCanvas() {
  const [error,setError]=useState("");
  const paint=useCallback((target:HTMLCanvasElement,mask:import("@/features/editor/types").LayerMask)=>{void drawMask(target,mask).catch(()=>setError("Could not draw mask"));},[]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<MaskStroke | null>(null);
  const layers = useEditorStore((s) => s.layers);
  const id = useEditorStore((s) => s.activeLayerId);
  const radius = useEditorStore((s) => s.brushRadius);
  const erase = useEditorStore((s) => s.brushErase);
  const layer = layers.find((l) => l.id === id);
  useEffect(() => {
    if (!canvas.current || !layer) return;
    const target = canvas.current;
    const resize = () => { const parent = target.parentElement; if (!parent) return; target.width = Math.max(1,parent.clientWidth); target.height = Math.max(1,parent.clientHeight); if(!layer.retouch) paint(target,layer.mask); else {const ctx=target.getContext("2d")!;ctx.clearRect(0,0,target.width,target.height);ctx.strokeStyle="#36efff";ctx.lineWidth=3;ctx.beginPath();ctx.arc((layer.x??.45)*target.width,(layer.y??.45)*target.height,radius*Math.min(target.width,target.height),0,Math.PI*2);ctx.stroke();} };
    resize(); const observer = new ResizeObserver(resize); observer.observe(target.parentElement!);
    return () => observer.disconnect();
  }, [layer,paint,radius]);
  if (!layer) return null;
  function point(e: React.PointerEvent<HTMLCanvasElement>) { const r = e.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) }; }
  return <><span role="status" className="sr-only">{error}</span><canvas ref={canvas} width={1000} height={1000} className="mask-paint-canvas" aria-label="Paint layer mask" onPointerDown={(e) => {
    e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
    if (layer.retouch) { const p=point(e); useEditorStore.getState().updateLayer(layer.id,{retouch:[...layer.retouch,{...p,radius:Math.min(.2,radius),sourceX:layer.x??.45,sourceY:layer.y??.45,mode:layer.retouchMode??"clone"}].slice(-300)}); return; }
    if (layer.mask.kind !== "brush") { useEditorStore.getState().updateLayer(layer.id, { mask: { ...layer.mask, ...point(e) } }); return; }
    stroke.current = { points: [point(e)], radius, erase };
  }} onPointerMove={(e) => { e.stopPropagation(); if (!stroke.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return; if (stroke.current.points.length < 3000) stroke.current.points.push(point(e)); paint(e.currentTarget, { ...layer.mask, strokes: [...layer.mask.strokes, stroke.current] }); }} onPointerCancel={() => { stroke.current = null; if (canvas.current) paint(canvas.current, layer.mask); }} onPointerUp={(e) => { e.stopPropagation(); if (!stroke.current) return; const strokes = [...layer.mask.strokes, stroke.current].slice(-500); useEditorStore.getState().updateLayer(layer.id, { mask: { ...layer.mask, strokes } }); stroke.current = null; }} /></>;
}
