import type { AiEditPlan, AdjustmentKey } from "../editor/types";
const add=(changes:AiEditPlan["changes"],key:AdjustmentKey,value:number,reason:string)=>changes.push({key,value,reason});
export function createLocalEditPlan(prompt:string):AiEditPlan{
  const text=prompt.toLowerCase(); const changes:AiEditPlan["changes"]=[]; const detected=["User-provided image","Natural-language editing intent"];
  if(/bright|สว่าง|หน้า/.test(text)){add(changes,"exposure",.32,"Raise overall brightness conservatively");add(changes,"shadows",20,"Recover darker regions");}
  if(/cinematic|หนัง|ดราม่า/.test(text)){add(changes,"contrast",18,"Create stronger tonal separation");add(changes,"highlights",-22,"Protect bright areas");add(changes,"temperature",-6,"Introduce a restrained cool balance");add(changes,"vignette",18,"Guide attention toward the subject");}
  if(/warm|sunset|อุ่น|พระอาทิตย์/.test(text)){add(changes,"temperature",14,"Shift white balance warmer");add(changes,"highlights",-10,"Preserve highlight detail");add(changes,"vibrance",12,"Lift muted colors");}
  if(/portrait|skin|ผิว|ใบหน้า/.test(text)){add(changes,"highlights",-16,"Soften bright skin areas");add(changes,"shadows",14,"Open facial shadows");add(changes,"clarity",-6,"Reduce harsh local contrast without changing geometry");}
  if(/night|กลางคืน|noise|นอยส์/.test(text)){add(changes,"shadows",24,"Recover low-light detail");add(changes,"noiseReduction",22,"Record intended noise reduction strength");add(changes,"highlights",-30,"Control point-light clipping");}
  if(/natural|ธรรมชาติ/.test(text)){add(changes,"contrast",5,"Keep contrast restrained");add(changes,"vibrance",8,"Enhance muted colors more gently than saturation");}
  if(!changes.length){add(changes,"exposure",.12,"Small general exposure refinement");add(changes,"contrast",6,"Subtle tonal separation");add(changes,"vibrance",8,"Conservative color enhancement");}
  const unique=[...new Map(changes.map(c=>[c.key,c])).values()];
  return {provider:"local-rule-based-demo",summary:"A transparent local rule-based edit plan was generated. No cloud model processed the image.",detected,changes:unique,warnings:["DEMO provider: recommendations are prompt rules, not computer-vision analysis.","Noise reduction is recorded in state but the current pixel renderer does not yet apply a denoise kernel."]};
}
