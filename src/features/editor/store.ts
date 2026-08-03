"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ADJUSTMENTS } from "./defaults";
import type { Adjustments, AdjustmentKey, ImportedImage } from "./types";

type EditorState = {
  image: ImportedImage | null; adjustments: Adjustments; committed: Adjustments; past: Adjustments[]; future: Adjustments[];
  zoom: number; panX: number; panY: number; showOriginal: boolean; activePreset: string | null;
  setImage: (image: ImportedImage | null) => void; previewAdjustment: (key: AdjustmentKey, value: number) => void;
  commitAdjustments: () => void; applyAdjustments: (values: Partial<Adjustments>, presetId?: string | null) => void;
  undo: () => void; redo: () => void; reset: () => void; setZoom: (zoom: number) => void; setPan: (x:number,y:number)=>void; toggleOriginal: (value?:boolean)=>void;
};
const clone=(value:Adjustments):Adjustments=>({...value});
const same=(a:Adjustments,b:Adjustments)=>JSON.stringify(a)===JSON.stringify(b);
export const useEditorStore=create<EditorState>()(persist((set,get)=>({
  image:null, adjustments:clone(DEFAULT_ADJUSTMENTS), committed:clone(DEFAULT_ADJUSTMENTS), past:[], future:[], zoom:1,panX:0,panY:0,showOriginal:false,activePreset:null,
  setImage:(image)=>set({image,zoom:1,panX:0,panY:0}),
  previewAdjustment:(key,value)=>set((s)=>({adjustments:{...s.adjustments,[key]:value},activePreset:null})),
  commitAdjustments:()=>{const s=get(); if(same(s.adjustments,s.committed))return; set({past:[...s.past,clone(s.committed)].slice(-80),future:[],committed:clone(s.adjustments)});},
  applyAdjustments:(values,presetId=null)=>set((s)=>{const next={...s.adjustments,...values}; return {past:[...s.past,clone(s.committed)].slice(-80),future:[],adjustments:next,committed:clone(next),activePreset:presetId};}),
  undo:()=>set((s)=>{if(!s.past.length)return s; const previous=s.past[s.past.length-1]; return {past:s.past.slice(0,-1),future:[clone(s.committed),...s.future].slice(0,80),adjustments:clone(previous),committed:clone(previous),activePreset:null};}),
  redo:()=>set((s)=>{if(!s.future.length)return s; const next=s.future[0]; return {past:[...s.past,clone(s.committed)].slice(-80),future:s.future.slice(1),adjustments:clone(next),committed:clone(next),activePreset:null};}),
  reset:()=>set((s)=>({past:[...s.past,clone(s.committed)].slice(-80),future:[],adjustments:clone(DEFAULT_ADJUSTMENTS),committed:clone(DEFAULT_ADJUSTMENTS),activePreset:null})),
  setZoom:(zoom)=>set({zoom:Math.min(4,Math.max(.25,zoom))}), setPan:(panX,panY)=>set({panX,panY}), toggleOriginal:(value)=>set((s)=>({showOriginal:value??!s.showOriginal}))
}),{name:"lumaforge-editor-v1",partialize:(s)=>({adjustments:s.committed,committed:s.committed,past:s.past,future:s.future,activePreset:s.activePreset})}));
