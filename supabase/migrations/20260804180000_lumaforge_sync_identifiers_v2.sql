-- Stable local identifiers make cloud synchronization idempotent.

alter table public.assets add column if not exists local_id text;
alter table public.edit_versions add column if not exists local_id text;
alter table public.export_records add column if not exists local_id text;

create unique index if not exists assets_owner_project_local_uidx
  on public.assets(owner_id, project_id, local_id)
  where local_id is not null;
create unique index if not exists versions_owner_project_local_uidx
  on public.edit_versions(owner_id, project_id, local_id)
  where local_id is not null;
create unique index if not exists exports_owner_project_local_uidx
  on public.export_records(owner_id, project_id, local_id)
  where local_id is not null;

alter table public.profiles force row level security;
alter table public.projects force row level security;
alter table public.assets force row level security;
alter table public.edit_versions force row level security;
alter table public.user_presets force row level security;
alter table public.export_records force row level security;

create or replace function public.increment_project_version(target_project_id uuid)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_version bigint;
begin
  update public.projects
  set server_version = server_version + 1,
      client_updated_at = now(),
      updated_at = now()
  where id = target_project_id
    and owner_id = auth.uid()
  returning server_version into next_version;

  if next_version is null then
    raise exception 'project not found or forbidden';
  end if;

  return next_version;
end;
$$;

grant execute on function public.increment_project_version(uuid) to authenticated;
