export const hueBands = ["red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta"] as const;
export function sampleHue(r:number,g:number,b:number) {
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
 if(d<8) return null;
 let h=max===r?60*((g-b)/d%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);h=(h+360)%360;
 const centers=[0,30,60,120,180,240,275,315];
 return hueBands[centers.map(c=>Math.min(Math.abs(c-h),360-Math.abs(c-h))).reduce((best,v,i,a)=>v<a[best]?i:best,0)];
}
export function clippingKind(r:number,g:number,b:number,a:number) {
 if(a===0)return 0;
 if(Math.max(r,g,b)<=2)return -1;
 if(Math.max(r,g,b)>=253)return 1;
 return 0;
}
// Inverse projective mapping in normalized coordinates, with premultiplied-alpha bilinear sampling.
export function projectivePixels(input:ImageData,horizontal:number,vertical:number) {
 const {width:w,height:h,data:src}=input,out=new Uint8ClampedArray(src.length),a=horizontal/250,b=vertical/250;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const nx=2*(x+.5)/w-1,ny=2*(y+.5)/h-1,den=1-a*nx-b*ny;
  const rawX=(nx/den+1)*w/2-.5,rawY=(ny/den+1)*h/2-.5;
  const sx=Math.abs(rawX)<1e-8?0:Math.abs(rawX-(w-1))<1e-8?w-1:rawX,sy=Math.abs(rawY)<1e-8?0:Math.abs(rawY-(h-1))<1e-8?h-1:rawY;
  if(den<=0||sx<0||sy<0||sx>w-1||sy>h-1)continue;
  const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0,idx=(y*w+x)*4;
  let alpha=0;const rgb=[0,0,0];
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const p=(Math.min(h-1,y0+dy)*w+Math.min(w-1,x0+dx))*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy),aw=src[p+3]*weight;
   alpha+=aw;for(let c=0;c<3;c++)rgb[c]+=src[p+c]*aw;
  }
  out[idx+3]=alpha;for(let c=0;c<3;c++)out[idx+c]=alpha?rgb[c]/alpha:0;
 }
 return out;
}
