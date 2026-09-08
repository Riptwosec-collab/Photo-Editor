import type { StoredProject } from "../editor/types";
import type { ExportOptions } from "./export";
export function inspectExport(canvas:HTMLCanvasElement,project:StoredProject,options:ExportOptions) {
 const notes:string[]=[],ctx=canvas.getContext("2d")!,w=canvas.width,h=canvas.height;
 if(options.longEdge>Math.max(w,h))notes.push("Requested size exceeds available detail. Export keeps native size without upscaling.");
 if(options.format==="image/jpeg"){
  // Scan in rows to avoid allocating a second full-resolution image buffer.
  let transparent=false;for(let y=0;y<h&&!transparent;y++){const row=ctx.getImageData(0,y,w,1).data;for(let i=3;i<row.length;i+=4)if(row[i]<255){transparent=true;break;}}
  if(transparent)notes.push("JPEG removes transparency using the chosen background color. Choose PNG to keep it.");
 }
 for(const l of project.layers??[])if(l.visible&&l.opacity>0&&l.kind==="text"&&l.text){
  ctx.save();ctx.font=`600 ${Math.max(1,(l.fontSize??.055)*w)}px sans-serif`;const m=ctx.measureText(l.text),tw=Math.min(m.width,w*.95),tx=(l.x??.5)*w,ty=(l.y??.8)*h;
  const left=tx-(l.textAlign==="left"?0:l.textAlign==="right"?tw:tw/2),top=ty-(m.actualBoundingBoxAscent||(.055*w)),bottom=ty+(m.actualBoundingBoxDescent||0),t=l.transform??{x:0,y:0,scale:1,rotation:0},a=t.rotation*Math.PI/180;
  const outside=[[left,top],[left+tw,top],[left,bottom],[left+tw,bottom]].some(([x,y])=>{const dx=(x-w/2)*t.scale,dy=(y-h/2)*t.scale,px=w/2+t.x*w+dx*Math.cos(a)-dy*Math.sin(a),py=h/2+t.y*h+dx*Math.sin(a)+dy*Math.cos(a);return px<0||py<0||px>w||py>h;});ctx.restore();
  if(outside)notes.push(`Text may extend outside the image: ${l.name}`);
 }
 return notes;
}
