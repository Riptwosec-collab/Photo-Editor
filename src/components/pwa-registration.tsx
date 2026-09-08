"use client";
import {useEffect,useState} from "react";
import {T} from "@/features/i18n/text";
export function PwaRegistration(){
 const [offline,setOffline]=useState(false),[waiting,setWaiting]=useState<ServiceWorker|null>(null);
 useEffect(()=>{
  const sync=()=>setOffline(!navigator.onLine);sync();window.addEventListener("online",sync);window.addEventListener("offline",sync);
  const navigate=(event:MouseEvent)=>{if(navigator.onLine||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const a=(event.target as Element)?.closest?.("a");if(!a||a.target||a.hasAttribute("download"))return;const url=new URL(a.href);if(url.origin===location.origin){event.preventDefault();event.stopPropagation();location.assign(url.href);}};
  document.addEventListener("click",navigate,true);
  let disposed=false;
  if("serviceWorker" in navigator&&process.env.NODE_ENV==="production")void navigator.serviceWorker.register("/sw.js").then(reg=>{
   if(disposed)return;if(reg.waiting)setWaiting(reg.waiting);
   reg.addEventListener("updatefound",()=>{const worker=reg.installing;worker?.addEventListener("statechange",()=>{if(!disposed&&worker.state==="installed"&&navigator.serviceWorker.controller)setWaiting(reg.waiting);});});
  }).catch(()=>{});
  return()=>{document.removeEventListener("click",navigate,true);disposed=true;window.removeEventListener("online",sync);window.removeEventListener("offline",sync);};
 },[]);
 return offline||waiting?<aside className="connection-banner" role="status">{offline&&<T text="Offline: local editing is available for loaded tools. AI and Cloud need a connection."/>}{waiting&&<button onClick={()=>{waiting.postMessage({type:"ACTIVATE_UPDATE"});setWaiting(null);}}><T text="Install app update (reopen after saving)"/></button>}</aside>:null;
}
