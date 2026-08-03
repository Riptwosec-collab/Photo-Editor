"use client";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { useEditorStore } from "@/features/editor/store";
const allowed=new Set(["image/jpeg","image/png","image/webp"]); const maxSize=30*1024*1024;
export function ImportZone(){const inputRef=useRef<HTMLInputElement>(null);const setImage=useEditorStore(s=>s.setImage);const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 async function load(file?:File){if(!file)return;setError("");if(!allowed.has(file.type)){setError("รองรับ JPG, PNG และ WebP ใน MVP นี้");return;}if(file.size>maxSize){setError("ไฟล์ต้องไม่เกิน 30 MB");return;}setLoading(true);try{const url=URL.createObjectURL(file);const bitmap=await createImageBitmap(file);setImage({name:file.name,type:file.type,size:file.size,width:bitmap.width,height:bitmap.height,objectUrl:url});bitmap.close();}catch{setError("ไม่สามารถถอดรหัสภาพนี้ได้");}finally{setLoading(false);}}
 return <div className="import-wrap"><button className="import-zone" onClick={()=>inputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void load(e.dataTransfer.files[0]);}}>{loading?<LoaderCircle className="spin"/>:<ImagePlus/>}<strong>{loading?"กำลังอ่านภาพ…":"ลากภาพมาวาง หรือคลิกเพื่อเลือก"}</strong><span>JPG · PNG · WebP · สูงสุด 30 MB</span></button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>void load(e.target.files?.[0])}/>{error&&<p role="alert" className="error-text">{error}</p>}</div>}
