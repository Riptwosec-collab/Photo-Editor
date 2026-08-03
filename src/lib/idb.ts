import type { StoredProject } from "@/features/editor/types";

const DB_NAME = "lumaforge-projects";
const STORE = "projects";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

async function writeProject(project: StoredProject) {
  const db = await openDb();
  try {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(project);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Project write failed"));
    });
  } finally {
    db.close();
  }
}

export async function saveProject(project: StoredProject) {
  await writeProject(project);
}

export async function getProject(id: string) {
  const db = await openDb();
  try {
    return await requestToPromise<StoredProject | undefined>(
      db.transaction(STORE).objectStore(STORE).get(id),
    );
  } finally {
    db.close();
  }
}

export async function listProjects(options: { includeArchived?: boolean } = {}) {
  const db = await openDb();
  try {
    const rows = await requestToPromise<StoredProject[]>(
      db.transaction(STORE).objectStore(STORE).getAll(),
    );
    return rows
      .filter((project) => options.includeArchived || !project.archivedAt)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally {
    db.close();
  }
}

export async function renameProject(id: string, name: string) {
  const project = await getProject(id);
  if (!project) throw new Error("Project not found");
  await writeProject({ ...project, name: name.trim(), updatedAt: new Date().toISOString() });
}

export async function duplicateProject(id: string) {
  const project = await getProject(id);
  if (!project) throw new Error("Project not found");
  const now = new Date().toISOString();
  const duplicate: StoredProject = {
    ...project,
    id: crypto.randomUUID(),
    name: `${project.name} Copy`,
    createdAt: now,
    updatedAt: now,
    archivedAt: undefined,
  };
  await writeProject(duplicate);
  return duplicate;
}

export async function setProjectArchived(id: string, archived: boolean) {
  const project = await getProject(id);
  if (!project) throw new Error("Project not found");
  await writeProject({
    ...project,
    archivedAt: archived ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProject(id: string) {
  const db = await openDb();
  try {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Project delete failed"));
    });
  } finally {
    db.close();
  }
}
