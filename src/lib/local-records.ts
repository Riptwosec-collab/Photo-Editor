/** Separate structured-clone store for recoverable drafts, queues, and AI job receipts. */
async function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("lumaforge-workspace-records", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
export async function putRecord<T>(id: string, value: T) {
  const db = await open();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("records", "readwrite"); tx.objectStore("records").put({ id, value }); tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error ?? new Error("Storage write failed")); }); }
  finally { db.close(); }
}
export async function getRecord<T>(id: string): Promise<T | undefined> {
  const db = await open();
  try { return await new Promise((resolve, reject) => { const r = db.transaction("records").objectStore("records").get(id); r.onsuccess = () => resolve(r.result?.value); r.onerror = () => reject(r.error); }); }
  finally { db.close(); }
}
export async function recordsByPrefix<T>(prefix: string): Promise<Array<{ id: string; value: T }>> {
  const db = await open();
  try { return await new Promise((resolve, reject) => { const r = db.transaction("records").objectStore("records").getAll(IDBKeyRange.bound(prefix, `${prefix}\uffff`)); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
  finally { db.close(); }
}
export async function removeRecord(id: string) {
  const db = await open();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction("records", "readwrite"); tx.objectStore("records").delete(id); tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error); }); }
  finally { db.close(); }
}
