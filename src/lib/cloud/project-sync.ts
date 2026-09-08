import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "@/features/editor/defaults";
import type { StoredProject } from "@/features/editor/types";
import { layersSchema } from "@/features/projects/backup";
import { listProjects, saveProject } from "@/lib/idb";

const BUCKET = "lumaforge-assets";
const BASELINE_KEY = "lumaforge-cloud-sync-baseline-v1";

export type CloudProjectRow = {
  id: string;
  owner_id: string;
  local_id: string | null;
  name: string;
  status: "active" | "archived" | "deleted";
  metadata: Record<string, unknown> | null;
  latest_version_id: string | null;
  server_version: number;
  client_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

type CloudVersionRow = {
  id: string;
  adjustments: Record<string, number> | null;
  geometry: Record<string, unknown> | null;
};

type CloudAssetRow = {
  object_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
};

export type SyncDecision = "push" | "pull" | "equal" | "conflict";

export type SyncConflict = {
  localId: string;
  local: StoredProject;
  cloud: CloudProjectRow;
  reason: string;
};

export type SyncProgress = {
  completed: number;
  total: number;
  message: string;
};

export type SyncResult = {
  pushed: number;
  pulled: number;
  equal: number;
  conflicts: SyncConflict[];
  errors: Array<{ localId: string; message: string }>;
};

function toMillis(value?: string | null) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolveSyncDecision(
  localUpdatedAt: string,
  cloudUpdatedAt: string,
  lastSyncedAt?: string,
): SyncDecision {
  const local = toMillis(localUpdatedAt);
  const cloud = toMillis(cloudUpdatedAt);
  const baseline = toMillis(lastSyncedAt);
  const tolerance = 1_000;

  if (!baseline) {
    if (Math.abs(local - cloud) <= tolerance) return "equal";
    return "conflict";
  }

  const localChanged = local > baseline + tolerance;
  const cloudChanged = cloud > baseline + tolerance;
  if (localChanged && cloudChanged) return "conflict";
  if (localChanged) return "push";
  if (cloudChanged) return "pull";
  return "equal";
}

function sanitizePathSegment(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-");
  return normalized.replace(/^-+|-+$/g, "").slice(0, 120) || "image";
}

function projectMetadata(project: StoredProject) {
  return {
    imageName: project.imageName,
    imageType: project.imageType,
    width: project.width,
    height: project.height,
    sizeBytes: project.imageBlob.size,
    source: "lumaforge-web",
    album: project.album ?? "", tags: project.tags ?? [], trashedAt: project.trashedAt ?? null,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function listCloudProjects(
  client: SupabaseClient,
): Promise<CloudProjectRow[]> {
  const { data, error } = await client
    .from("projects")
    .select("id,owner_id,local_id,name,status,metadata,latest_version_id,server_version,client_updated_at,created_at,updated_at")
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudProjectRow[];
}

export async function pushLocalProject(
  client: SupabaseClient, userId: string, project: StoredProject, expectedVersion?: number,
): Promise<CloudProjectRow> {
  const fields = "id,owner_id,local_id,name,status,metadata,latest_version_id,server_version,client_updated_at,created_at,updated_at";
  const existing = await client.from("projects").select(fields).eq("owner_id", userId).eq("local_id", project.id).maybeSingle();
  if (existing.error) throw existing.error;
  let cloud = existing.data as CloudProjectRow | null;
  if (cloud && expectedVersion !== undefined && cloud.server_version !== expectedVersion) throw new Error("Cloud changed again. Refresh before resolving this conflict.");
  if (!cloud) {
    const created = await client.from("projects").insert({ owner_id: userId, local_id: project.id, name: project.name, status: "active", metadata: projectMetadata(project), client_updated_at: project.updatedAt }).select(fields).single();
    if (created.error) throw created.error;
    cloud = created.data as CloudProjectRow;
  }
  // Assets and versions are immutable. Only publish the new pointer after all uploads finish.
  const revision = crypto.randomUUID();
  const objectPath = `${userId}/${cloud.id}/original/${revision}-${sanitizePathSegment(project.imageName)}`;
  const upload = await client.storage.from(BUCKET).upload(objectPath, project.imageBlob, { contentType: project.imageType, upsert: false });
  if (upload.error) throw upload.error;
  const asset = await client.from("assets").insert({ owner_id: userId, project_id: cloud.id, local_id: `original:${revision}`, kind: "original", bucket_id: BUCKET, object_path: objectPath, original_name: project.imageName, mime_type: project.imageType, size_bytes: project.imageBlob.size, width: project.width, height: project.height });
  if (asset.error) throw asset.error;
  const version = await client.from("edit_versions").insert({ owner_id: userId, project_id: cloud.id, local_id: revision, name: "Synced edit", adjustments: project.adjustments, geometry: { ...project.geometry, layers: project.layers ?? [] } }).select("id").single();
  if (version.error) throw version.error;
  const result = await client.from("projects").update({ name: project.name, status: project.archivedAt ? "archived" : "active", archived_at: project.archivedAt ?? null, metadata: { ...projectMetadata(project), originalAssetPath: objectPath }, latest_version_id: version.data.id, client_updated_at: project.updatedAt, server_version: cloud.server_version + 1 }).eq("id",cloud.id).eq("owner_id",userId).eq("server_version",cloud.server_version).select(fields).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new Error("Another device changed this project. Your upload is preserved; refresh to resolve the conflict.");
  return result.data as CloudProjectRow;
}

export async function pullCloudProject(
  client: SupabaseClient,
  userId: string,
  cloud: CloudProjectRow,
  localIdOverride?: string,
): Promise<StoredProject> {
  let query = client.from("assets").select("object_path,original_name,mime_type,size_bytes,width,height").eq("project_id",cloud.id).eq("owner_id",userId).eq("kind","original");
  if (typeof cloud.metadata?.originalAssetPath === "string") query = query.eq("object_path",cloud.metadata.originalAssetPath);
  const { data: asset, error: assetError } = await query.order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (assetError) throw assetError;
  if (!asset) throw new Error(`Cloud project “${cloud.name}” has no original asset.`);

  const { data: downloaded, error: downloadError } = await client.storage
    .from(BUCKET)
    .download((asset as CloudAssetRow).object_path);
  if (downloadError) throw downloadError;

  let version: CloudVersionRow | null = null;
  if (cloud.latest_version_id) {
    const response = await client
      .from("edit_versions")
      .select("id,adjustments,geometry")
      .eq("id", cloud.latest_version_id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (response.error) throw response.error;
    version = response.data as CloudVersionRow | null;
  }

  const metadata = cloud.metadata ?? {};
  const typedAsset = asset as CloudAssetRow;
  const project: StoredProject = {
    id: localIdOverride ?? cloud.local_id ?? cloud.id,
    name: cloud.name,
    createdAt: cloud.created_at,
    updatedAt: cloud.updated_at,
    imageBlob: downloaded,
    imageName: typedAsset.original_name,
    imageType: typedAsset.mime_type,
    width: typedAsset.width ?? Number(metadata.width ?? 1),
    height: typedAsset.height ?? Number(metadata.height ?? 1),
    adjustments: {
      ...DEFAULT_ADJUSTMENTS,
      ...(version?.adjustments ?? {}),
    },
    geometry: Object.fromEntries(Object.entries(DEFAULT_GEOMETRY).map(([key,value]) => [key, version?.geometry?.[key] ?? value])) as StoredProject["geometry"],
    layers: layersSchema.parse(version?.geometry?.layers ?? []),
    album: typeof metadata.album === "string" ? metadata.album.slice(0,80) : undefined,
    tags: Array.isArray(metadata.tags) ? metadata.tags.filter((t):t is string => typeof t === "string").slice(0,20).map(t=>t.slice(0,40)) : [],
    trashedAt: typeof metadata.trashedAt === "string" ? metadata.trashedAt : undefined,
    archivedAt: cloud.status === "archived" ? cloud.updated_at : undefined,
  };
  await saveProject(project);
  return project;
}

type RevisionBaseline = Record<string, { local: string; cloud: number }>;
function baselineFor(userId: string): RevisionBaseline { try { return JSON.parse(localStorage.getItem(`${BASELINE_KEY}:${userId}:revisions`) ?? "{}"); } catch { return {}; } }
async function fingerprint(project: StoredProject) {
  const image = new Uint8Array(await project.imageBlob.arrayBuffer());
  const bytes = await crypto.subtle.digest("SHA-256", image);
  const hash = [...new Uint8Array(bytes)].map((n) => n.toString(16).padStart(2,"0")).join("");
  const recipe = new TextEncoder().encode(JSON.stringify({ hash, name: project.name, adjustments: project.adjustments, geometry: project.geometry, layers: project.layers ?? [], archived: project.archivedAt ?? null, album: project.album ?? "", tags: project.tags ?? [], trashedAt: project.trashedAt ?? null }));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", recipe))].map((n) => n.toString(16).padStart(2,"0")).join("");
}
export function decideRevision(local: string, cloud: number, baseline?: { local: string; cloud: number }): SyncDecision {
  if (!baseline) return "conflict";
  const a = local !== baseline.local, b = cloud !== baseline.cloud;
  return a && b ? "conflict" : a ? "push" : b ? "pull" : "equal";
}
export async function markConflictResolved(localId: string, userId: string, local: StoredProject, cloud: CloudProjectRow) {
  const baseline = baselineFor(userId); baseline[localId] = { local: await fingerprint(local), cloud: cloud.server_version };
  localStorage.setItem(`${BASELINE_KEY}:${userId}:revisions`,JSON.stringify(baseline));
}
export async function syncAllProjects(client: SupabaseClient, userId: string, onProgress?: (progress: SyncProgress) => void): Promise<SyncResult> {
  const [locals, clouds] = await Promise.all([listProjects({ includeArchived: true, includeTrashed: true }),listCloudProjects(client)]);
  const localMap = new Map(locals.map((p) => [p.id,p]));
  const cloudMap = new Map(clouds.map((p) => [p.local_id ?? p.id,p]));
  const ids = [...new Set([...localMap.keys(),...cloudMap.keys()])];
  const baseline = baselineFor(userId);
  const result: SyncResult = { pushed:0,pulled:0,equal:0,conflicts:[],errors:[] };
  for (const [index,id] of ids.entries()) {
    const local=localMap.get(id), cloud=cloudMap.get(id);
    onProgress?.({ completed:index,total:ids.length,message:`Checking ${local?.name ?? cloud?.name}` });
    try {
      if (local && !cloud) { const pushed=await pushLocalProject(client,userId,local); await markConflictResolved(id,userId,local,pushed); result.pushed++; continue; }
      if (cloud && !local) { const pulled=await pullCloudProject(client,userId,cloud); await markConflictResolved(id,userId,pulled,cloud); result.pulled++; continue; }
      if (!cloud || !local) continue;
      const decision=decideRevision(await fingerprint(local),cloud.server_version,baseline[id]);
      if (decision === "push") { const pushed=await pushLocalProject(client,userId,local,cloud.server_version); await markConflictResolved(id,userId,local,pushed); result.pushed++; }
      else if (decision === "pull") { const pulled=await pullCloudProject(client,userId,cloud); await markConflictResolved(id,userId,pulled,cloud); result.pulled++; }
      else if (decision === "conflict") result.conflicts.push({ localId:id,local,cloud,reason:"Both copies need review. Choose a version or keep both." });
      else result.equal++;
    } catch (e) { result.errors.push({ localId:id,message:errorMessage(e) }); }
  }
  onProgress?.({ completed:ids.length,total:ids.length,message:"Synchronization complete" }); return result;
}

export async function getCloudStorageUsage(client: SupabaseClient) {
  const { data, error } = await client.from("assets").select("size_bytes");
  if (error) throw error;
  return (data ?? []).reduce((total, row) => total + Number(row.size_bytes ?? 0), 0);
}
