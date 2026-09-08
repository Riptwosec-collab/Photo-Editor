import { DEFAULT_GEOMETRY } from "./defaults";
import { createLayer } from "../render/layers";
import type { AspectRatio, EditorSnapshot } from "./types";
export const TEMPLATES: Array<{id:string;name:string;ratio:AspectRatio;headline:string;subtitle:string}> = [
 {id:"product",name:"Product card",ratio:"4:5",headline:"NEW COLLECTION",subtitle:"Made for your everyday"},
 {id:"post",name:"Social post",ratio:"1:1",headline:"A MOMENT TO REMEMBER",subtitle:"Your story starts here"},
 {id:"story",name:"Story",ratio:"9:16",headline:"TODAY’S STORY",subtitle:"Explore something new"},
 {id:"profile",name:"Profile image",ratio:"1:1",headline:"",subtitle:""},
];
export function templateSnapshot(snapshot:EditorSnapshot,id:string):EditorSnapshot {
 const template=TEMPLATES.find(t=>t.id===id); if(!template) throw new Error("Unknown template");
 const text=[template.headline,template.subtitle].filter(Boolean).map((value,i)=>({...createLayer("text"),name:i?"Template subtitle":"Template headline",text:value,y:i?.88:.8,fontSize:i?.027:.05}));
 if((snapshot.layers?.length??0)+text.length>20) throw new Error("Remove a layer before applying this template");
 return {...snapshot,geometry:{...DEFAULT_GEOMETRY,aspectRatio:template.ratio},layers:[...(snapshot.layers??[]),...text]};
}
