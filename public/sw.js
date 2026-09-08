/* Only cache public application resources. Never cache auth, API, Cloud or image requests. */
const CACHE="lumaforge-public-v3";
const PAGES=new Set(["/","/editor","/projects","/export-center","/settings","/presets","/batch"]);
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.add("/offline.html"))));
self.addEventListener("activate",event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith("lumaforge-")&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener("message",event=>{if(event.data?.type==="ACTIVATE_UPDATE")self.skipWaiting();});
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET"||url.origin!==self.location.origin||req.headers.has("authorization"))return;
 const page=req.mode==="navigate"&&PAGES.has(url.pathname)&&!url.searchParams.has("code")&&!url.searchParams.has("token");
 const asset=url.pathname.startsWith("/_next/static/")||["/manifest.webmanifest","/icon.svg","/icon-192.png","/icon-512.png","/icon-180.png","/offline.html"].includes(url.pathname);
 if(!page&&!asset)return;
 const key=page?url.origin+url.pathname:req;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);if(asset){const hit=await cache.match(key);if(hit)return hit;}
  try{const response=await fetch(req);if(response.ok&&response.type==="basic"&&!response.redirected){const copy=response.clone();event.waitUntil(cache.put(key,copy).catch(()=>{}));}return response;}
  catch {return await cache.match(key)|| (page?await cache.match("/offline.html"):null)||new Response("Unavailable offline",{status:503});}
 })());
});
