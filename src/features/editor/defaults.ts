import type { Adjustments, EditorPreset, Geometry } from "./types";
export const DEFAULT_ADJUSTMENTS: Adjustments = { exposure:0,contrast:0,highlights:0,shadows:0,whites:0,blacks:0,temperature:0,tint:0,vibrance:0,saturation:0,clarity:0,sharpness:0,noiseReduction:0,vignette:0,grain:0,curveShadows:0,curveMidtones:0,curveHighlights:0,redHue:0,redSaturation:0,redLuminance:0,orangeHue:0,orangeSaturation:0,orangeLuminance:0,yellowHue:0,yellowSaturation:0,yellowLuminance:0,greenHue:0,greenSaturation:0,greenLuminance:0,aquaHue:0,aquaSaturation:0,aquaLuminance:0,blueHue:0,blueSaturation:0,blueLuminance:0,purpleHue:0,purpleSaturation:0,purpleLuminance:0,magentaHue:0,magentaSaturation:0,magentaLuminance:0 };
export const DEFAULT_GEOMETRY: Geometry = { rotation:0, flipX:false, flipY:false, aspectRatio:"original" };
export const PRESETS: EditorPreset[] = [
  { id:"natural", name:"Natural", description:"Balanced light and color", adjustments:{ exposure:.12, contrast:6, highlights:-12, shadows:14, vibrance:8, clarity:3 } },
  { id:"cinematic", name:"Cinematic", description:"Deep contrast with cooler shadows", adjustments:{ exposure:-.08, contrast:18, highlights:-24, shadows:10, temperature:-7, tint:4, saturation:-8, clarity:12, vignette:22, grain:10 } },
  { id:"portrait", name:"Portrait", description:"Soft highlight roll-off and warm skin", adjustments:{ exposure:.18, contrast:-4, highlights:-18, shadows:20, temperature:6, tint:3, vibrance:5, clarity:-5, noiseReduction:8 } },
  { id:"night", name:"Night", description:"Recover shadows and control noise", adjustments:{ exposure:.28, contrast:10, highlights:-32, shadows:28, temperature:-5, saturation:4, noiseReduction:22, clarity:8 } },
  { id:"mono", name:"Mono", description:"Clean black and white", adjustments:{ contrast:20, highlights:-12, shadows:16, saturation:-100, clarity:15, grain:18, vignette:15 } }
];
