-- PostgREST upserts require regular composite unique indexes.

drop index if exists public.assets_owner_project_local_uidx;
drop index if exists public.versions_owner_project_local_uidx;
drop index if exists public.exports_owner_project_local_uidx;

create unique index if not exists assets_owner_project_local_uidx
  on public.assets(owner_id, project_id, local_id);
create unique index if not exists versions_owner_project_local_uidx
  on public.edit_versions(owner_id, project_id, local_id);
create unique index if not exists exports_owner_project_local_uidx
  on public.export_records(owner_id, project_id, local_id);
