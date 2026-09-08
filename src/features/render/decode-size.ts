import { getCropRect } from "../editor/image-processing";
import type { Geometry } from "../editor/types";
export function previewDecodeSize(width:number|undefined,height:number|undefined,geometry:Geometry,limit:number) {
 if(!width||!height||width<=1||height<=1||!Number.isFinite(width*height)||limit<=0)return undefined;
 const crop=getCropRect(width,height,geometry.aspectRatio,geometry);
 const scale=Math.min(1,limit/Math.max(crop.sw,crop.sh));
 if(scale>=1)return undefined;
 return {resizeWidth:Math.max(1,Math.ceil(width*scale)),resizeHeight:Math.max(1,Math.ceil(height*scale)),resizeQuality:"high" as const,imageOrientation:"from-image" as const};
}
