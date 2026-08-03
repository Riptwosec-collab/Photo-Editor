import type { ExportRecord, StoredProject, StoredVersion } from "@/features/editor/types";

const DB_NAME = "lumaforge-projects";
const PROJECTS = "projects";
const VERSIONS = "versions";
const EXPORTS = "exports";
const VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS)) {
        const projects = db.createObjectStore(PROJECTS, { keyPath: "id" });
        projects.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains(VERSIONS)) {
        const versions = db.createObjectStore(VERSIONS, { keyPath: "id" });
        versions.createIndex("projectId", "projectId");
        versions.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains(EXPORTS)) {
        const exportsStore = db.createObjectStore(EXPORTS, { keyPath: "id" });
        exportsStore.createIndex("projectId", "projectId");
        exportsStore.createIndex("createdAt", "createdAt");
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

async function writeRecord<T>(storeName: string, record: T) {
  const db = await openDb();
  try {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB write failed"));
    });
  } finally {
    db.close();
  }
}

async function deleteRecord(storeName: string, id: string) {
  const db = await openDb();
  try {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB delete failed"));
    });
  } finally {
    db.close();
  }
}

export async function saveProject(project: StoredProject) {
  await writeRecord(PROJECTS, project);
}

export async function getProject(id: string) {
  const db = await openDb();
  try {
    return await requestToPromise<StoredProject | undefined>(
      db.transaction(PROJECTS).objectStore(PROJECTS).get(id),
    );
  } finally {
    db.close();
  }
}

export async function listProjects(options: { includeArchived?: boolean } = {}) {
  const db = await openDb();
  try {
    const rows = await requestToPromise<StoredProject[]>(
      db.transaction(PROJECTS).objectStore(PROJECTS).getAll(),
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
  await saveProject({ ...project, name: name.trim(), updatedAt: new Date().toISOString() });
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
  await saveProject(duplicate);
  return duplicate;
}

export async function setProjectArchived(id: string, archived: boolean) {
  const project = await getProject(id);
  if (!project) throw new Error("Project not found");
  await saveProject({
    ...project,
    archivedAt: archived ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProject(id: string) {
  const db = await openDb();
  try {
    const transaction = db.transaction([PROJECTS, VERSIONS, EXPORTS], "readwrite");
    transaction.objectStore(PROJECTS).delete(id);
    const deleteByProject = (storeName: string) => {
      const store = transaction.objectStore(storeName);
      const index = store.index("projectId");
      const cursor = index.openCursor(IDBKeyRange.only(id));
      cursor.onsuccess = () => {
        const row = cursor.result;
        if (!row) return;
        row.delete();
        row.continue();
      };
    };
    deleteByProject(VERSIONS);
    deleteByProject(EXPORTS);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Project delete failed"));
    });
  } finally {
    db.close();
  }
}

export async function saveVersion(version: StoredVersion) {
  await writeRecord(VERSIONS, version);
}

export async function listVersions(projectId: string) {
  const db = await openDb();
  try {
    const rows = await requestToPromise<StoredVersion[]>(
      db.transaction(VERSIONS).objectStore(VERSIONS).index("projectId").getAll(projectId),
    );
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } finally {
    db.close();
  }
}

export async function renameVersion(id: string, name: string) {
  const db = await openDb();
  try {
    const store = db.transaction(VERSIONS).objectStore(VERSIONS);
    const version = await requestToPromise<StoredVersion | undefined>(store.get(id));
    if (!version) throw new Error("Version not found");
    await writeRecord(VERSIONS, { ...version, name: name.trim() });
  } finally {
    db.close();
  }
}

export async function deleteVersion(id: string) {
  await deleteRecord(VERSIONS, id);
}

export async function saveExportRecord(record: ExportRecord) {
  await writeRecord(EXPORTS, record);
}

export async function listExportRecords(projectId?: string) {
  const db = await openDb();
  try {
    const store = db.transaction(EXPORTS).objectStore(EXPORTS);
    const rows = projectId
      ? await requestToPromise<ExportRecord[]>(store.index("projectId").getAll(projectId))
      : await requestToPromise<ExportRecord[]>(store.getAll());
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } finally {
    db.close();
  }
}
