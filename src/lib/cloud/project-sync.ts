import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ADJUSTMENTS, DEFAULT_GEOMETRY } from "@/features/editor/defaults";
import type { StoredProject } from "@/features/editor/types";
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

type SyncBaseline = Record<string, string>;

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

function readBaseline(): SyncBaseline {
  if (typeof window === "undefined") return {};
  try {
    const value = window.localStorage.getItem(BASELINE_KEY);
    return value ? (JSON.parse(value) as SyncBaseline) : {};
  } catch {
    return {};
  }
}

function writeBaseline(value: SyncBaseline) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BASELINE_KEY, JSON.stringify(value));
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
  client: SupabaseClient,
  userId: string,
  project: StoredProject,
): Promise<CloudProjectRow> {
  const { data: projectRow, error: projectError } = await client
    .from("projects")
    .upsert(
      {
        owner_id: userId,
        local_id: project.id,
        name: project.name,
        status: project.archivedAt ? "archived" : "active",
        metadata: projectMetadata(project),
        client_updated_at: project.updatedAt,
        archived_at: project.archivedAt ?? null,
      },
      { onConflict: "owner_id,local_id" },
    )
    .select("id,owner_id,local_id,name,status,metadata,latest_version_id,server_version,client_updated_at,created_at,updated_at")
    .single();
  if (projectError) throw projectError;
  const cloud = projectRow as CloudProjectRow;

  const objectPath = `${userId}/${cloud.id}/original/${sanitizePathSegment(project.imageName)}`;
  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(objectPath, project.imageBlob, {
      contentType: project.imageType,
      cacheControl: "3600",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error: assetError } = await client.from("assets").upsert(
    {
      owner_id: userId,
      project_id: cloud.id,
      local_id: `original:${project.id}`,
      kind: "original",
      bucket_id: BUCKET,
      object_path: objectPath,
      original_name: project.imageName,
      mime_type: project.imageType,
      size_bytes: project.imageBlob.size,
      width: project.width,
      height: project.height,
      metadata: { localProjectId: project.id },
    },
    { onConflict: "owner_id,project_id,local_id" },
  );
  if (assetError) throw assetError;

  const { data: version, error: versionError } = await client
    .from("edit_versions")
    .upsert(
      {
        owner_id: userId,
        project_id: cloud.id,
        local_id: `current:${project.id}`,
        name: "Current synced edit",
        adjustments: project.adjustments,
        geometry: project.geometry,
      },
      { onConflict: "owner_id,project_id,local_id" },
    )
    .select("id")
    .single();
  if (versionError) throw versionError;

  const { data: updated, error: updateError } = await client
    .from("projects")
    .update({
      latest_version_id: version.id,
      client_updated_at: project.updatedAt,
      server_version: Math.max(1, Number(cloud.server_version ?? 1) + 1),
    })
    .eq("id", cloud.id)
    .eq("owner_id", userId)
    .select("id,owner_id,local_id,name,status,metadata,latest_version_id,server_version,client_updated_at,created_at,updated_at")
    .single();
  if (updateError) throw updateError;
  return updated as CloudProjectRow;
}

export async function pullCloudProject(
  client: SupabaseClient,
  userId: string,
  cloud: CloudProjectRow,
): Promise<StoredProject> {
  const { data: asset, error: assetError } = await client
    .from("assets")
    .select("object_path,original_name,mime_type,size_bytes,width,height")
    .eq("project_id", cloud.id)
    .eq("owner_id", userId)
    .eq("kind", "original")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
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
    id: cloud.local_id ?? cloud.id,
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
    geometry: {
      ...DEFAULT_GEOMETRY,
      ...(version?.geometry ?? {}),
    },
    archivedAt: cloud.status === "archived" ? cloud.updated_at : undefined,
  };
  await saveProject(project);
  return project;
}

export async function syncAllProjects(
  client: SupabaseClient,
  userId: string,
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncResult> {
  const [localProjects, cloudProjects] = await Promise.all([
    listProjects({ includeArchived: true }),
    listCloudProjects(client),
  ]);
  const localById = new Map(localProjects.map((project) => [project.id, project]));
  const cloudById = new Map(
    cloudProjects
      .filter((project) => project.local_id)
      .map((project) => [project.local_id as string, project]),
  );
  const ids = Array.from(new Set([...localById.keys(), ...cloudById.keys()]));
  const baseline = readBaseline();
  const result: SyncResult = { pushed: 0, pulled: 0, equal: 0, conflicts: [], errors: [] };

  for (const [index, localId] of ids.entries()) {
    const local = localById.get(localId);
    const cloud = cloudById.get(localId);
    onProgress?.({ completed: index, total: ids.length, message: `Checking ${local?.name ?? cloud?.name ?? localId}` });
    try {
      if (local && !cloud) {
        await pushLocalProject(client, userId, local);
        result.pushed += 1;
        baseline[localId] = new Date().toISOString();
        continue;
      }
      if (!local && cloud) {
        await pullCloudProject(client, userId, cloud);
        result.pulled += 1;
        baseline[localId] = new Date().toISOString();
        continue;
      }
      if (!local || !cloud) continue;

      const decision = resolveSyncDecision(local.updatedAt, cloud.updated_at, baseline[localId]);
      if (decision === "push") {
        await pushLocalProject(client, userId, local);
        result.pushed += 1;
        baseline[localId] = new Date().toISOString();
      } else if (decision === "pull") {
        await pullCloudProject(client, userId, cloud);
        result.pulled += 1;
        baseline[localId] = new Date().toISOString();
      } else if (decision === "conflict") {
        result.conflicts.push({
          localId,
          local,
          cloud,
          reason: "Local and cloud copies changed after the last successful sync.",
        });
      } else {
        result.equal += 1;
      }
    } catch (error) {
      result.errors.push({ localId, message: errorMessage(error) });
    }
  }

  writeBaseline(baseline);
  onProgress?.({ completed: ids.length, total: ids.length, message: "Synchronization complete" });
  return result;
}

export function markConflictResolved(localId: string) {
  const baseline = readBaseline();
  baseline[localId] = new Date().toISOString();
  writeBaseline(baseline);
}

export async function getCloudStorageUsage(client: SupabaseClient) {
  const { data, error } = await client.from("assets").select("size_bytes");
  if (error) throw error;
  return (data ?? []).reduce((total, row) => total + Number(row.size_bytes ?? 0), 0);
}
