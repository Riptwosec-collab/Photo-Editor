import test from "node:test";
import assert from "node:assert/strict";
import { healPatch, refineCoverage, cleanEdgeColors } from "../src/features/render/retouch";
import { aiReadiness } from "../src/features/ai/readiness";
import { layersSchema } from "../src/features/projects/backup";
import { createLayer } from "../src/features/render/layers";
import { useEditorStore } from "../src/features/editor/store";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "../src/features/editor/defaults";
function pixels(w:number,h:number,rgb:number[]) {return {width:w,height:h,data:new Uint8ClampedArray(Array.from({length:w*h},()=>rgb).flat())} as ImageData;}
test("healing adapts surrounding tone, keeps texture differences and alpha",()=>{
 const source=pixels(10,10,[80,90,100,255]),target=pixels(10,10,[140,130,120,255]);
 source.data[(5*10+5)*4]=90;
 const result=healPatch(source,target);
 assert.equal(result.data[0],140);assert.equal(result.data[(5*10+5)*4],150);assert.equal(result.data[3],255);
});
test("edge refinement preserves transparent exterior and opaque interior",()=>{
 const data={width:3,height:1,data:new Uint8ClampedArray([90,80,70,0,90,80,70,128,90,80,70,255])} as ImageData;
 refineCoverage(data,.5,0);assert.equal(data.data[3],0);assert.ok(data.data[7]>128);assert.equal(data.data[11],255);
});
test("edge cleanup reduces spill without changing coverage or opaque pixels",()=>{
 const data={width:3,height:1,data:new Uint8ClampedArray([0,255,0,120,220,50,30,255,0,0,0,0])} as ImageData;
 cleanEdgeColors(data,1);assert.ok(data.data[0]>0);assert.ok(data.data[1]<255);assert.equal(data.data[3],120);assert.equal(data.data[4],220);assert.equal(data.data[11],0);
});
test("transform, healing and color masks remain portable and undoable",()=>{
 const s=useEditorStore.getState();s.loadRecipe(DEFAULT_ADJUSTMENTS,DEFAULT_GEOMETRY,[]);
 const layer={...createLayer(),transform:{x:.1,y:-.2,scale:.8,rotation:25},retouchMode:"heal" as const,retouch:[{x:.5,y:.5,radius:.02,sourceX:.4,sourceY:.4,mode:"heal" as const}],colorReplace:{color:"#4993ff",strength:.8},decontaminate:.6};
 assert.deepEqual(layersSchema.parse([layer])[0].transform,layer.transform);s.addLayer(layer);s.updateLayer(layer.id,{transform:{...layer.transform,rotation:90}});s.undo();assert.equal(useEditorStore.getState().layers[0].transform?.rotation,25);s.redo();assert.equal(useEditorStore.getState().layers[0].transform?.rotation,90);
 assert.equal(layersSchema.safeParse([{...layer,transform:{...layer.transform,scale:999}}]).success,false);s.loadRecipe(DEFAULT_ADJUSTMENTS,DEFAULT_GEOMETRY,[]);
});
test("AI readiness fails closed on missing configuration and invalid model versions",()=>{
 assert.equal(aiReadiness({},"selection").enabled,false);
 const env={NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"public",SUPABASE_SERVICE_ROLE_KEY:"private",REPLICATE_API_TOKEN:"private",AI_ALLOWED_USER_IDS:"owner",REPLICATE_SELECTION_VERSION:"a".repeat(64),AI_SELECTION_COST_LABEL:"Configured estimate",AI_SELECTION_RESERVE_CENTS:"10",AI_DAILY_BUDGET_CENTS:"100",AI_DAILY_JOBS_PER_USER:"3"};
 assert.equal(aiReadiness(env,"selection").enabled,true);assert.deepEqual(aiReadiness({...env,REPLICATE_SELECTION_VERSION:"latest"},"selection").missing,["modelVersion"]);
});

test('storage encoding preserves image bytes and reads legacy Blob records',async()=>{
 const {encodeStored,decodeStored}=await import('../src/lib/storage-codec');
 const original={id:'project',imageBlob:new Blob([new Uint8Array([1,2,255,0])],{type:'image/png'}),queue:[{output:new Blob(['data'],{type:'image/webp'})}]};
 const encoded=await encodeStored(original) as {imageBlob:unknown};assert.equal(encoded.imageBlob instanceof Blob,false);
 const restored=decodeStored<typeof original>(structuredClone(encoded));assert.equal(restored.imageBlob.type,'image/png');assert.deepEqual([...new Uint8Array(await restored.imageBlob.arrayBuffer())],[1,2,255,0]);assert.equal(await restored.queue[0].output.text(),'data');assert.equal(decodeStored<typeof original>(original).imageBlob,original.imageBlob);
});
test('live transform previews create exactly one undo step when released',()=>{
 const s=useEditorStore.getState();s.loadRecipe(DEFAULT_ADJUSTMENTS,DEFAULT_GEOMETRY,[]);const layer=createLayer('text');s.addLayer(layer);const before=useEditorStore.getState().past.length;
 for(let i=0;i<10;i++)s.previewLayer(layer.id,{transform:{x:i/100,y:0,scale:1,rotation:0}});assert.equal(useEditorStore.getState().past.length,before);
 s.updateLayer(layer.id,{transform:{x:.09,y:0,scale:1,rotation:0}});assert.equal(useEditorStore.getState().past.length,before+1);s.undo();assert.equal(useEditorStore.getState().layers[0].transform,undefined);s.loadRecipe(DEFAULT_ADJUSTMENTS,DEFAULT_GEOMETRY,[]);
});

test('persisted batch files retain their filename and modification date',async()=>{
 const {encodeStored,decodeStored}=await import('../src/lib/storage-codec');const file=new File(['pixels'],'queued.png',{type:'image/png',lastModified:1000});
 const restored=decodeStored<File>(structuredClone(await encodeStored(file)));assert.equal(restored.name,'queued.png');assert.equal(restored.lastModified,1000);assert.equal(await restored.text(),'pixels');
});
