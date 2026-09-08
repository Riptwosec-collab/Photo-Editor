/** Store image bytes as ArrayBuffers: WebKit can reject IDB writes containing network-backed Blobs. */
export async function encodeStored(value: unknown): Promise<unknown> {
 if (value instanceof Blob) return {__lumaforgeBinary:1,type:value.type,bytes:await value.arrayBuffer(),...(typeof File!=="undefined" && value instanceof File ? {name:value.name,lastModified:value.lastModified}:{})};
 if (Array.isArray(value)) return Promise.all(value.map(encodeStored));
 if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
  return Object.fromEntries(await Promise.all(Object.entries(value).map(async([key,item])=>[key,await encodeStored(item)])));
 }
 return value;
}
export function decodeStored<T>(value: unknown): T {
 if (Array.isArray(value)) return value.map(item=>decodeStored(item)) as T;
 if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
  const row=value as Record<string,unknown>;
  if(row.__lumaforgeBinary===1 && row.bytes instanceof ArrayBuffer && typeof row.type === "string") {
   if(typeof row.name==="string" && typeof File!=="undefined") return new File([row.bytes],row.name,{type:row.type,lastModified:typeof row.lastModified==="number"?row.lastModified:0}) as T;
   return new Blob([row.bytes],{type:row.type}) as T;
  }
  return Object.fromEntries(Object.entries(row).map(([key,item])=>[key,decodeStored(item)])) as T;
 }
 // Older records contain Blobs directly and remain readable without a destructive migration.
 return value as T;
}
