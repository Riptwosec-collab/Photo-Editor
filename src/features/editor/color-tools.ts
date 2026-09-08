export type CubeLut = { title: string; size: number; domainMin: number[]; domainMax: number[]; values: number[] };
export type ChannelCurves = { red: number[]; green: number[]; blue: number[] };
export function parseCube(text: string): CubeLut {
  if (text.length > 5_000_000) throw new Error("LUT exceeds 5 MB");
  let size = 0, title = "Imported LUT";
  let domainMin = [0,0,0], domainMax = [1,1,1];
  const values: number[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim(); if (!line) continue;
    if (line.startsWith("TITLE ")) { title = line.slice(6).replace(/^"|"$/g, "").slice(0,100); continue; }
    const [key,...rest] = line.split(/\s+/);
    if (key === "LUT_3D_SIZE") { size = Number(rest[0]); if (!Number.isInteger(size) || size < 2 || size > 33) throw new Error("Use a 3D LUT with size 2–33"); continue; }
    if (key === "DOMAIN_MIN" || key === "DOMAIN_MAX") { const nums = rest.map(Number); if (nums.length !== 3 || nums.some(n => !Number.isFinite(n))) throw new Error("Invalid LUT domain"); if (key === "DOMAIN_MIN") domainMin = nums; else domainMax = nums; continue; }
    const row = [key,...rest].map(Number);
    if (row.length !== 3 || row.some(n => !Number.isFinite(n) || Math.abs(n) > 100)) throw new Error("Unsupported or invalid CUBE line");
    values.push(...row);
  }
  if (!size || values.length !== size ** 3 * 3 || domainMax.some((n,i) => n <= domainMin[i])) throw new Error("Incomplete LUT or invalid domain");
  return { title,size,domainMin,domainMax,values };
}
const clamp = (n:number) => Math.max(0,Math.min(1,n));
export function sampleCube(lut: CubeLut, rgb: number[]): number[] {
  const coords = rgb.map((n,c) => clamp((n-lut.domainMin[c])/(lut.domainMax[c]-lut.domainMin[c]))*(lut.size-1));
  const lo=coords.map(Math.floor), hi=lo.map(n=>Math.min(lut.size-1,n+1)), frac=coords.map((n,c)=>n-lo[c]);
  const out=[0,0,0];
  for(let b=0;b<2;b++) for(let g=0;g<2;g++) for(let r=0;r<2;r++) {
    const weight=(r?frac[0]:1-frac[0])*(g?frac[1]:1-frac[1])*(b?frac[2]:1-frac[2]);
    const i=((b?hi[2]:lo[2])*lut.size*lut.size+(g?hi[1]:lo[1])*lut.size+(r?hi[0]:lo[0]))*3;
    for(let c=0;c<3;c++) out[c]+=lut.values[i+c]*weight;
  }
  return out.map(clamp);
}
export function curveValue(value:number, points:number[]) {
  const x=clamp(value)*(points.length-1), i=Math.floor(x);
  return clamp(points[i]+((points[Math.min(i+1,points.length-1)]-points[i])*(x-i)));
}
export function applyProColor(data: ImageData, curves?: ChannelCurves, lut?: CubeLut) {
  const channels=curves ? [curves.red,curves.green,curves.blue].map(points=>Array.from({length:256},(_,i)=>curveValue(i/255,points))) : undefined;
  for(let i=0;i<data.data.length;i+=4) {
    let rgb=[0,1,2].map(c=>channels ? channels[c][data.data[i+c]] : data.data[i+c]/255);
    if(lut) rgb=sampleCube(lut,rgb);
    for(let c=0;c<3;c++) data.data[i+c]=rgb[c]*255;
  }
  return data;
}
