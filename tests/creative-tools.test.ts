import test from "node:test";
import assert from "node:assert/strict";
import { parseCube, sampleCube, curveValue, applyProColor } from "../src/features/editor/color-tools";
import { RenderQueue } from "../src/features/render/render-queue";
import { templateSnapshot } from "../src/features/editor/templates";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "../src/features/editor/defaults";
import { layersSchema } from "../src/features/projects/backup";
import { createLayer } from "../src/features/render/layers";
import { positiveInteger } from "../src/features/ai/budget";
const cube='TITLE "Identity"\nLUT_3D_SIZE 2\n0 0 0\n1 0 0\n0 1 0\n1 1 0\n0 0 1\n1 0 1\n0 1 1\n1 1 1';
test("CUBE ordering and trilinear interpolation preserve RGB at fractional coordinates",()=>{
 const lut=parseCube(cube);for(const input of [[0,0,0],[1,1,1],[.13,.67,.41],[1,0,0]])sampleCube(lut,input).forEach((v,i)=>assert.ok(Math.abs(v-input[i])<1e-9));
 const ranged=parseCube(cube+'\nDOMAIN_MIN -1 -1 -1\nDOMAIN_MAX 1 1 1');assert.deepEqual(sampleCube(ranged,[0,0,0]),[.5,.5,.5]);
 for(const invalid of [cube.replace('SIZE 2','SIZE 64'),cube+'\n0 0 0',cube.replace('0 0 0','NaN 0 0'),cube+'\nDOMAIN_MAX 0 0 0'])assert.throws(()=>parseCube(invalid));
});
test("channel curves alter only the chosen channel and preserve alpha",()=>{
 const data={width:1,height:1,data:new Uint8ClampedArray([128,128,128,83])} as ImageData;
 applyProColor(data,{red:[0,.5,.8,.9,1],green:[0,.25,.5,.75,1],blue:[0,.25,.5,.75,1]});assert.ok(data.data[0]>200);assert.deepEqual([...data.data.slice(1)],[128,128,83]);assert.equal(curveValue(1,[0,.2,.4,.6,1]),1);
});
test("render queue cancels pending jobs and does not run decodes concurrently",async()=>{
 const queue=new RenderQueue();const release=await queue.acquire();let began=false;const abort=new AbortController();const waiting=queue.acquire(abort.signal);const rejected=assert.rejects(waiting,{name:'AbortError'});abort.abort();await rejected;
 const next=queue.acquire().then(release=>{began=true;return release;});await Promise.resolve();assert.equal(began,false);release();const done=await next;assert.equal(began,true);release();done();(await queue.acquire())();
});
test("story template preserves existing edits and creates portable, undoable text layers",()=>{
 const base={adjustments:{...DEFAULT_ADJUSTMENTS,exposure:.8},geometry:DEFAULT_GEOMETRY,layers:[createLayer()]};const next=templateSnapshot(base,'story');assert.equal(next.geometry.aspectRatio,'9:16');assert.equal(next.adjustments.exposure,.8);assert.equal(next.layers?.length,3);assert.equal(base.layers.length,1);assert.ok(layersSchema.safeParse(next.layers).success);
});
test("new layer data survives validation and rejects malformed LUTs and retouch coordinates",()=>{
 const layer={...createLayer(),lut:parseCube(cube),retouch:[{x:.2,y:.4,radius:.05,sourceX:.3,sourceY:.6}]};assert.deepEqual(layersSchema.parse([layer])[0].lut,layer.lut);assert.equal(layersSchema.safeParse([{...layer,lut:{...layer.lut,values:[0]}}]).success,false);assert.equal(layersSchema.safeParse([{...layer,retouch:[{...layer.retouch[0],x:2}]}]).success,false);
});
test("paid AI stays disabled for missing, fractional or invalid allowance values",()=>{for(const value of [undefined,'','0','-1','NaN','Infinity','2.5','1000001'])assert.equal(positiveInteger(value),0);assert.equal(positiveInteger('50'),50);});

test("48 MP preview decodes at preview resolution while deep crops retain source detail",async()=>{
 const {previewDecodeSize}=await import('../src/features/render/decode-size');
 assert.deepEqual(previewDecodeSize(8000,6000,DEFAULT_GEOMETRY,1000),{resizeWidth:1000,resizeHeight:750,resizeQuality:'high',imageOrientation:'from-image'});
 assert.equal(previewDecodeSize(8000,6000,{...DEFAULT_GEOMETRY,aspectRatio:'free',cropWidth:.1,cropHeight:.1},1000),undefined);
 assert.equal(previewDecodeSize(400,300,DEFAULT_GEOMETRY,1000),undefined);
});
