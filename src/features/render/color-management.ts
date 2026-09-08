export type OutputColorSpace = "srgb" | "display-p3";

/** Canvas support alone does not guarantee the encoder preserves the profile. */
export async function supportsP3Png(): Promise<boolean> {
  const canvas=document.createElement("canvas");canvas.width=canvas.height=1;
  const ctx=canvas.getContext("2d",{colorSpace:"display-p3"});
  if(ctx?.getContextAttributes().colorSpace!=="display-p3")return false;
  ctx.fillStyle="color(display-p3 1 0 0)";ctx.fillRect(0,0,1,1);
  const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,"image/png"));
  if(!blob)return false;
  const decoded=await createImageBitmap(blob);
  try {
    ctx.clearRect(0,0,1,1);ctx.drawImage(decoded,0,0);
    const data=ctx.getImageData(0,0,1,1,{colorSpace:"display-p3"}).data;
    return data[0]>250&&data[1]<5&&data[2]<5;
  } finally {decoded.close();canvas.width=0;canvas.height=0;}
}
export async function encodeColorManaged(canvas:HTMLCanvasElement,format:string,quality:number,space:OutputColorSpace="srgb") {
 if(space==="srgb")return new Promise<Blob|null>(r=>canvas.toBlob(r,format,quality));
 if(format!=="image/png")throw new Error("Display P3 export requires PNG");
 if(!await supportsP3Png())throw new Error("This browser cannot preserve Display P3 in PNG. Choose sRGB.");
 const output=document.createElement("canvas");output.width=canvas.width;output.height=canvas.height;
 try {
  const ctx=output.getContext("2d",{colorSpace:"display-p3"})!;
  ctx.drawImage(canvas,0,0); // Browser converts sRGB values into P3; it does not invent missing gamut.
  return await new Promise<Blob|null>(r=>output.toBlob(r,"image/png"));
 } finally {output.width=0;output.height=0;}
}
