import type { Adjustments } from "./types";
const clamp=(n:number)=>Math.max(0,Math.min(255,n));
export function processImageData(data: ImageData, a: Adjustments, seed = 17): ImageData {
  const pixels=data.data; const exposure=Math.pow(2,a.exposure); const contrast=(259*(a.contrast+255))/(255*(259-a.contrast));
  let random=seed>>>0; const rand=()=>{random=(1664525*random+1013904223)>>>0; return random/4294967296;};
  for(let i=0;i<pixels.length;i+=4){
    let r=pixels[i]*exposure, g=pixels[i+1]*exposure, b=pixels[i+2]*exposure;
    const lum=.2126*r+.7152*g+.0722*b; const shadowMask=1-Math.min(1,lum/128); const highlightMask=Math.max(0,(lum-128)/127);
    const shadowLift=a.shadows*1.15*shadowMask; const highlightShift=a.highlights*1.05*highlightMask;
    r+=shadowLift+highlightShift+a.whites*.18-a.blacks*.14; g+=shadowLift+highlightShift+a.whites*.18-a.blacks*.14; b+=shadowLift+highlightShift+a.whites*.18-a.blacks*.14;
    r=contrast*(r-128)+128; g=contrast*(g-128)+128; b=contrast*(b-128)+128;
    r+=a.temperature*.42+a.tint*.12; b-=a.temperature*.42; g-=a.tint*.25;
    const gray=.299*r+.587*g+.114*b; const sat=1+(a.saturation+a.vibrance*.55)/100; r=gray+(r-gray)*sat; g=gray+(g-gray)*sat; b=gray+(b-gray)*sat;
    const clarity=1+a.clarity/180; r=128+(r-128)*clarity; g=128+(g-128)*clarity; b=128+(b-128)*clarity;
    if(a.grain>0){const grain=(rand()-.5)*a.grain*.85; r+=grain;g+=grain;b+=grain;}
    pixels[i]=clamp(r);pixels[i+1]=clamp(g);pixels[i+2]=clamp(b);
  }
  return data;
}
export function applyVignette(ctx:CanvasRenderingContext2D,width:number,height:number,amount:number){if(amount<=0)return; const radius=Math.max(width,height)*.72; const gradient=ctx.createRadialGradient(width/2,height/2,Math.min(width,height)*.18,width/2,height/2,radius); gradient.addColorStop(0,"rgba(0,0,0,0)"); gradient.addColorStop(1,`rgba(0,0,0,${Math.min(.78,amount/110)})`); ctx.save();ctx.globalCompositeOperation="multiply";ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);ctx.restore();}
export function renderToCanvas(source:CanvasImageSource,sourceWidth:number,sourceHeight:number,canvas:HTMLCanvasElement,a:Adjustments,maxDimension=1800){
  const scale=Math.min(1,maxDimension/Math.max(sourceWidth,sourceHeight)); const width=Math.max(1,Math.round(sourceWidth*scale)); const height=Math.max(1,Math.round(sourceHeight*scale)); canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext("2d",{willReadFrequently:true}); if(!ctx)throw new Error("Canvas 2D is unavailable"); ctx.drawImage(source,0,0,width,height); const data=ctx.getImageData(0,0,width,height);ctx.putImageData(processImageData(data,a),0,0);applyVignette(ctx,width,height,a.vignette);return {width,height};
}
