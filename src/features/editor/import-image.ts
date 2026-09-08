export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
export function isSupportedImage(file: File) { return ["image/jpeg","image/png","image/webp","image/heic","image/heif"].includes(file.type) || /\.hei[cf]$/i.test(file.name); }
export async function normalizeImage(file: File): Promise<File> {
  if(file.size > 30*1048576) throw new Error("Image exceeds 30 MB");
  if(!isSupportedImage(file)) throw new Error("Use JPG, PNG, WebP, HEIC or HEIF");
  if(!/image\/hei[cf]/i.test(file.type) && !/\.hei[cf]$/i.test(file.name)) return file;
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | undefined;
    try {
      bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});
      if(bitmap.width*bitmap.height>60_000_000) throw new Error("Image exceeds 60 megapixels");
      const canvas=document.createElement("canvas");canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext("2d")!.drawImage(bitmap,0,0);
      const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",.95));canvas.width=0;canvas.height=0;
      if(blob) return new File([blob],file.name.replace(/\.hei[cf]$/i,"")+".jpg",{type:"image/jpeg"});
    } catch(error) { if(error instanceof Error&&error.message.includes("60 megapixels"))throw error; }
    finally {bitmap?.close();}
  }
  // HEIC conversion is loaded only when needed. Keep processing on the device.
  const convert=(await import("heic2any")).default;
  const result=await convert({blob:file,toType:"image/jpeg",quality:.95});
  const blob=Array.isArray(result)?result[0]:result;
  if(!blob) throw new Error("HEIC contains no decodable image");
  return new File([blob],file.name.replace(/\.hei[cf]$/i,"")+".jpg",{type:"image/jpeg"});
}
