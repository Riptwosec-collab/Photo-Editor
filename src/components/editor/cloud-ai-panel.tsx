"use client";
import { T, useT } from "@/features/i18n/text";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/features/editor/store";
import { useStudioStore } from "@/features/studio/store";
import { getSupabaseBrowserClient } from "@/lib/cloud/supabase-browser";
import { renderStudio } from "@/features/render/studio-renderer";
import { createLayer, drawMask } from "@/features/render/layers";
import { blobToDataUrl } from "@/features/projects/backup";
import { getRecord, putRecord } from "@/lib/local-records";
import Image from "next/image";
type Job = { token: string; kind: string; status: string; signature: string; result?: string };
async function signature() {
  const s = useEditorStore.getState();
  if (!s.image) throw new Error("Import an image first");
  const data = await fetch(s.image.objectUrl).then((r) => r.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", data);
  const current = useEditorStore.getState();
  if (current.image?.objectUrl !== s.image.objectUrl || current.committed !== s.committed) throw new Error("The image changed. Try again.");
  const encoded = JSON.stringify({ source: [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2,"0")).join(""), recipe: s.committed });
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(encoded))),n=>n.toString(16).padStart(2,"0")).join("");
}
export function CloudAiPanel() {
  const t = useT();
  const image = useEditorStore((s) => s.image);
  const [capabilities, setCapabilities] = useState<Record<string,{ enabled: boolean; cost: string; reserveCents:number; dailyBudgetCents:number; dailyJobs:number }>>({});
  const [history,setHistory]=useState<Array<Job & {id:string;createdAt:string;reservedCents:number}>>([]);
  const [usage,setUsage]=useState<{usedCents:number;usedJobs:number;dailyCents:number;dailyJobs:number}|null>(null);
  const [kind,setKind] = useState("background");
  const [target,setTarget] = useState("person");
  const [consent,setConsent] = useState(false);
  const [prompt,setPrompt] = useState("Clean natural background, seamless texture, no object");
  const [job,setJob] = useState<Job | null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const alive = useRef(true);
  const save = (next: Job) => { setJob(next); void putRecord("ai:last-job",next).catch(() => setMessage("Could not save the job receipt")); };
  useEffect(() => { alive.current = true; fetch("/api/ai/jobs").then((r) => r.json()).then(setCapabilities).catch(() => setMessage("AI configuration is unavailable")); getRecord<Job>("ai:last-job").then((j) => { if (alive.current && j) setJob(j); }).catch(() => {}); return () => { alive.current = false; }; }, []);
  async function auth() { const client = getSupabaseBrowserClient(); const session = client ? (await client.auth.getSession()).data.session : null; if (!session) throw new Error("Sign in on the Cloud page before using AI"); return { Authorization: `Bearer ${session.access_token}` }; }
  async function check(current: Job) {
    const headers = await auth(); const response = await fetch(`/api/ai/jobs?token=${encodeURIComponent(current.token)}`, { headers }); const body = await response.json(); if (!response.ok) throw new Error(body.error);
    let result = current.result;
    if (body.status === "succeeded" && !result) { const file = await fetch(`/api/ai/jobs?token=${encodeURIComponent(current.token)}&download=1`, { headers }); if (!file.ok) throw new Error("Could not download AI result"); result = await blobToDataUrl(await file.blob()); }
    if (alive.current) save({ ...current, status: body.status, result });
    if (body.error) setMessage(body.error);
  }
  useEffect(() => {
    if (!job || !["starting","processing"].includes(job.status)) return;
    const timer = setTimeout(() => { void check(job).catch((e) => { if (alive.current) setMessage(e instanceof Error ? e.message : "Job status unavailable. Refresh status to retry."); }); }, 2200);
    return () => clearTimeout(timer);
    // check deliberately uses the current receipt once per scheduled poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);
  async function start() {
    if (!image || busy || !consent) return;
    setBusy(true); setMessage("");
    try {
      const headers = await auth(); const state = useEditorStore.getState(); const capture = await signature();
      const canvas = document.createElement("canvas"); const blob = await fetch(image.objectUrl).then((r) => r.blob());
      await renderStudio(canvas, { blob, sourceWidth:image.width,sourceHeight:image.height, adjustments: state.adjustments, geometry: state.geometry, layers: state.layers, limit: 1536 });
      let mask: string | undefined;
      if (kind === "inpaint") {
        const layer = state.layers.find((l) => l.id === state.activeLayerId);
        if (!layer || layer.mask.kind === "all" || (layer.mask.kind === "brush" && !layer.mask.strokes.length)) throw new Error("Create a brush mask in Layers and paint the object first");
        const maskCanvas = document.createElement("canvas"); maskCanvas.width = canvas.width; maskCanvas.height = canvas.height; await drawMask(maskCanvas,layer.mask);
        const ctx = maskCanvas.getContext("2d")!; ctx.globalCompositeOperation = "destination-over"; ctx.fillStyle = "black"; ctx.fillRect(0,0,maskCanvas.width,maskCanvas.height); mask = maskCanvas.toDataURL("image/png");
      }
      const response = await fetch("/api/ai/jobs", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({requestId:crypto.randomUUID(),fingerprint:capture, kind, image: canvas.toDataURL("image/jpeg",.92), mask, prompt:kind==="selection"?target:prompt, consent }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      if(body.warning)setMessage(body.warning);
      save({ token: body.token, status: body.status, kind, signature: capture });
    } catch (e) { setMessage(e instanceof Error ? e.message : "AI request failed"); }
    finally { setBusy(false); }
  }
  return <section className="cloud-ai-panel"><h3> <T text={"AI image tools"} /> </h3><label> <T text={"Tool"} /> <select value={kind} disabled={busy} onChange={(e) => { setKind(e.target.value); setConsent(false); }}><option value="background">{t("Remove background")}</option><option value="inpaint">{t("Remove object / Inpaint")}</option><option value="selection">{t("AI selection mask")}</option></select></label>{kind === "selection" && <label><T text="Select subject"/><select value={target} onChange={e=>setTarget(e.target.value)}>{["person","sky","background","object"].map(value=><option key={value} value={value}>{t(value)}</option>)}</select><small><T text="Requires a segmentation model returning a white-on-black mask. Refine edges with feather and brush."/></small></label>}{kind === "inpaint" && <><label> <T text={"Replacement prompt"} /> <textarea maxLength={500} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label><button disabled={!image || useEditorStore.getState().layers.length >= 20} onClick={() => { const s=useEditorStore.getState(); const layer=createLayer(); layer.name="Object removal mask"; layer.adjustments={}; layer.mask.kind="brush"; s.addLayer(layer); s.setMaskEditing(true); const ui=useStudioStore.getState(); ui.setCompareMode("off"); ui.setInspectorCollapsed(false); ui.setActiveInspectorSection("layers"); }}> <T text={"Paint object mask"} /> </button></>}<p>{capabilities[kind]?.enabled ? `Provider estimate: ${capabilities[kind].cost}` : "Provider setup required. These tools are not active yet."}</p>{capabilities[kind]?.enabled && <p><T text="Reserved allowance"/>: ${(capabilities[kind].reserveCents/100).toFixed(2)} · <T text="Daily shared allowance"/>: ${(capabilities[kind].dailyBudgetCents/100).toFixed(2)} · {capabilities[kind].dailyJobs} <T text="jobs per user"/></p>}<small><T text="Allowance tracks reserved estimates, not the final bill. Failed or uncertain requests remain reserved. Set a hard spending limit with the provider."/></small><label className="consent-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> <T text={"Send this image and mask to Replicate. Charges follow the configured model pricing."} /> </label><small> <T text={"AI working image: up to 1536 px. Your original is kept. Review the result before adding it as a layer."} /> </small><button disabled={!image || !consent || !capabilities[kind]?.enabled || busy || Boolean(job && ["starting","processing"].includes(job.status))} onClick={() => void start()}><T text={busy ? "Uploading…" : "Start AI edit"} /></button>{job && <div className="ai-job-card"><p role="status"> <T text={"Job:"} /> {job.status}</p><button onClick={() => void check(job).catch((e) => setMessage(e.message))}> <T text={"Refresh status"} /> </button>{["starting","processing"].includes(job.status) && <button onClick={async () => { try { const r=await fetch("/api/ai/jobs",{ method:"POST",headers:{...await auth(),"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",token:job.token}) }); const b=await r.json(); if(!r.ok) throw new Error(b.error); save({...job,status:b.status}); } catch(e) {setMessage(e instanceof Error?e.message:"Cancel failed");} }}> <T text={"Cancel job"} /> </button>}{job.result && <><Image src={job.result} width={400} height={300} alt="AI result awaiting review" unoptimized /><button disabled={!image || useEditorStore.getState().layers.length >= 20} onClick={async () => { try { if(await signature()!==job.signature) {setMessage("The image changed after this request. Restore the earlier recipe or start a new edit.");return;} const layer=createLayer(job.kind === "selection"?"adjustment":"raster");
      if(job.kind==="selection") {
        const bitmap=await createImageBitmap(await fetch(job.result!).then(r=>r.blob()));
        if(bitmap.width*bitmap.height>16_000_000){bitmap.close();throw new Error("Selection mask is too large");}
        const mask=document.createElement("canvas");mask.width=bitmap.width;mask.height=bitmap.height;const ctx=mask.getContext("2d")!;ctx.drawImage(bitmap,0,0);bitmap.close();const pixels=ctx.getImageData(0,0,mask.width,mask.height);
        for(let i=0;i<pixels.data.length;i+=4){pixels.data[i+3]=Math.round((pixels.data[i]*.2126+pixels.data[i+1]*.7152+pixels.data[i+2]*.0722)*pixels.data[i+3]/255);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;}ctx.putImageData(pixels,0,0);
        layer.mask={...layer.mask,kind:"image",dataUrl:mask.toDataURL("image/png"),feather:0};layer.adjustments={};layer.name="AI selection";
      } else { layer.dataUrl=job.result; layer.name=job.kind === "background" ? "AI background cutout" : "AI object removal"; } useEditorStore.getState().addLayer(layer); setMessage("Result added as a reversible layer"); } catch(e) { setMessage(e instanceof Error ? e.message : "Could not add result"); } }}> <T text={"Add result as layer"} /> </button></>}</div>}<details><summary><T text="AI usage & history"/></summary><button onClick={async()=>{try{const r=await fetch("/api/ai/jobs?history=1",{headers:await auth()});const b=await r.json();if(!r.ok)throw new Error(b.error);setHistory(b.jobs);setUsage(b);}catch(e){setMessage((e as Error).message);}}}><T text="Load my usage"/></button>{usage&&<p>{usage.usedJobs}/{usage.dailyJobs} <T text="jobs today"/> · ${(usage.usedCents/100).toFixed(2)} <T text="reserved"/></p>}{history.map(h=><div key={h.id}><small>{new Date(h.createdAt).toLocaleString()} · {h.kind} · {h.status}</small>{h.token&&<button onClick={()=>{save(h);void check(h).catch(e=>setMessage(e.message));}}><T text="Recover job"/></button>}</div>)}</details>{message && <p role="alert"><T text={message} /></p>}</section>;
}
