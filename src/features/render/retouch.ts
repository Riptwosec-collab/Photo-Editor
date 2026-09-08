/** Match the source texture to the destination's surrounding color, retaining alpha. */
export function healPatch(source: ImageData, destination: ImageData) {
  const w = source.width, h = source.height;
  const sourceMean = [0, 0, 0], targetMean = [0, 0, 0];
  let weight = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const distance = Math.hypot((x + .5 - w / 2) / (w / 2), (y + .5 - h / 2) / (h / 2));
    if (distance < .65 || distance > .95) continue;
    const i = (y * w + x) * 4;
    const a = Math.min(source.data[i + 3], destination.data[i + 3]) / 255;
    for (let c = 0; c < 3; c++) { sourceMean[c] += source.data[i + c] * a; targetMean[c] += destination.data[i + c] * a; }
    weight += a;
  }
  if (!weight) return source;
  for (let i = 0; i < source.data.length; i += 4) for (let c = 0; c < 3; c++) {
    source.data[i + c] += (targetMean[c] - sourceMean[c]) / weight;
  }
  return source;
}

/** Refine soft coverage without binarizing fine hair detail. */
export function refineCoverage(data: ImageData, shift = 0, contrast = 0) {
  const slope = 1 + contrast * 5;
  for (let i = 3; i < data.data.length; i += 4) {
    const a = data.data[i] / 255;
    if (a > 0 && a < 1) data.data[i] = Math.round(Math.max(0, Math.min(1, (a - .5 + shift * .4) * slope + .5)) * 255);
  }
  return data;
}

/** Separable box feather; works in Safari without CanvasRenderingContext2D.filter. */
export function featherCoverage(data: ImageData, radius: number) {
 const w=data.width,h=data.height,r=Math.min(64,Math.max(0,Math.round(radius)));
 if(!r)return data;
 const horizontal=new Float32Array(w*h),span=2*r+1;
 const alpha=(x:number,y:number)=>data.data[(y*w+Math.max(0,Math.min(w-1,x)))*4+3];
 for(let y=0;y<h;y++){
  let sum=0;for(let x=-r;x<=r;x++)sum+=alpha(x,y);
  for(let x=0;x<w;x++){horizontal[y*w+x]=sum/span;sum+=alpha(x+r+1,y)-alpha(x-r,y);}
 }
 for(let x=0;x<w;x++){
  const at=(y:number)=>horizontal[Math.max(0,Math.min(h-1,y))*w+x];
  let sum=0;for(let y=-r;y<=r;y++)sum+=at(y);
  for(let y=0;y<h;y++){const i=(y*w+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=255;data.data[i+3]=sum/span;sum+=at(y+r+1)-at(y-r);}
 }
 return data;
}

/** Pull colors at translucent cutout edges towards a nearby opaque interior pixel. */
export function cleanEdgeColors(data: ImageData, strength: number) {
  if (!strength) return data;
  const original = new Uint8ClampedArray(data.data), w = data.width, h = data.height;
  const reach = Math.max(2, Math.min(12, Math.round(Math.min(w, h) * .004)));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, a = original[i + 3];
    if (!a || a >= 250) continue;
    let found = -1;
    for (let r = 1; r <= reach && found < 0; r++) for (const [dx, dy] of [[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,r],[r,-r],[-r,-r]]) {
      const px = x + dx, py = y + dy;
      if (px < 0 || py < 0 || px >= w || py >= h) continue;
      const j = (py * w + px) * 4;
      if (original[j + 3] >= 250) { found = j; break; }
    }
    if (found >= 0) for (let c = 0; c < 3; c++) data.data[i + c] += (original[found + c] - original[i + c]) * strength * (1 - a / 255);
  }
  return data;
}
