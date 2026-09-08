// A single full-image decode at a time bounds peak memory across previews, exports and batches.
export class RenderQueue {
  private busy = false;
  private pending: Array<{ signal?: AbortSignal; start: () => void; cancel: () => void }> = [];
  acquire(signal?: AbortSignal): Promise<() => void> {
    return new Promise((resolve,reject) => {
      if(signal?.aborted) { reject(new DOMException("Render cancelled","AbortError")); return; }
      const job={signal,start:()=>{ signal?.removeEventListener("abort",job.cancel); this.busy=true; let released=false; resolve(()=>{if(released)return;released=true;this.busy=false;this.next();}); },cancel:()=>{this.pending=this.pending.filter(p=>p!==job);reject(new DOMException("Render cancelled","AbortError"));}};
      signal?.addEventListener("abort",job.cancel,{once:true}); this.pending.push(job);this.next();
    });
  }
  private next() { if(!this.busy) this.pending.shift()?.start(); }
}
export const renderQueue = new RenderQueue();
