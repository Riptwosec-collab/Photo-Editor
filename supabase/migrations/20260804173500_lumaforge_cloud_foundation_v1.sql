-- LumaForge AI Studio cloud foundation.
-- Applied to project gfqkexnqbjtuwsyqacsw on 2026-08-04.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free','pro','team','enterprise')),
  storage_limit_bytes bigint not null default 10737418240 check (storage_limit_bytes >= 0),
  ai_credits integer not null default 100 check (ai_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  local_id text,
  name text not null check (char_length(name) between 1 and 160),
  status text not null default 'active' check (status in ('active','archived','deleted')),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  latest_version_id uuid,
  server_version bigint not null default 1 check (server_version > 0),
  client_updated_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, local_id)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null default 'original' check (kind in ('original','preview','mask','reference','export')),
  bucket_id text not null default 'lumaforge-assets',
  object_path text not null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  checksum_sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bucket_id, object_path)
);

create table if not exists public.edit_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_version_id uuid references public.edit_versions(id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  note text,
  adjustments jsonb not null default '{}'::jsonb,
  geometry jsonb not null default '{}'::jsonb,
  masks jsonb not null default '[]'::jsonb,
  layers jsonb not null default '[]'::jsonb,
  ai_operations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_latest_version_fk'
  ) then
    alter table public.projects
      add constraint projects_latest_version_fk
      foreign key (latest_version_id)
      references public.edit_versions(id)
      on delete set null
      not valid;
  end if;
end $$;

create table if not exists public.user_presets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  local_id text,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  scope text not null default 'full' check (scope in ('full','light','color')),
  adjustments jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, local_id)
);

create table if not exists public.export_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  version_id uuid references public.edit_versions(id) on delete set null,
  filename text not null,
  format text not null check (format in ('jpeg','png','webp','tiff','avif','heic','dng')),
  settings jsonb not null default '{}'::jsonb,
  object_path text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists projects_owner_updated_idx on public.projects(owner_id, updated_at desc);
create index if not exists projects_owner_status_idx on public.projects(owner_id, status);
create index if not exists assets_owner_project_idx on public.assets(owner_id, project_id);
create index if not exists versions_owner_project_created_idx on public.edit_versions(owner_id, project_id, created_at desc);
create index if not exists presets_owner_updated_idx on public.user_presets(owner_id, updated_at desc);
create index if not exists exports_owner_project_created_idx on public.export_records(owner_id, project_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'creator'), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.cleanup_user_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.export_records where owner_id = old.id;
  delete from public.user_presets where owner_id = old.id;
  delete from public.edit_versions where owner_id = old.id;
  delete from public.assets where owner_id = old.id;
  delete from public.projects where owner_id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
before delete on auth.users
for each row execute procedure public.cleanup_user_content();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at before update on public.assets for each row execute procedure public.set_updated_at();
drop trigger if exists presets_set_updated_at on public.user_presets;
create trigger presets_set_updated_at before update on public.user_presets for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.assets enable row level security;
alter table public.edit_versions enable row level security;
alter table public.user_presets enable row level security;
alter table public.export_records enable row level security;

revoke all on public.profiles, public.projects, public.assets, public.edit_versions, public.user_presets, public.export_records from anon;
grant select, insert, update, delete on public.profiles, public.projects, public.assets, public.edit_versions, public.user_presets, public.export_records to authenticated;

-- Owner policies. Child rows also verify ownership of the parent project.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles for delete to authenticated using (id = auth.uid());

drop policy if exists projects_select_own on public.projects;
create policy projects_select_own on public.projects for select to authenticated using (owner_id = auth.uid());
drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own on public.projects for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists projects_update_own on public.projects;
create policy projects_update_own on public.projects for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own on public.projects for delete to authenticated using (owner_id = auth.uid());

drop policy if exists assets_select_own on public.assets;
create policy assets_select_own on public.assets for select to authenticated using (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);
drop policy if exists assets_insert_own on public.assets;
create policy assets_insert_own on public.assets for insert to authenticated with check (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);
drop policy if exists assets_update_own on public.assets;
create policy assets_update_own on public.assets for update to authenticated using (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
) with check (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);
drop policy if exists assets_delete_own on public.assets;
create policy assets_delete_own on public.assets for delete to authenticated using (owner_id = auth.uid());

drop policy if exists versions_select_own on public.edit_versions;
create policy versions_select_own on public.edit_versions for select to authenticated using (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);
drop policy if exists versions_insert_own on public.edit_versions;
create policy versions_insert_own on public.edit_versions for insert to authenticated with check (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);
drop policy if exists versions_update_own on public.edit_versions;
create policy versions_update_own on public.edit_versions for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists versions_delete_own on public.edit_versions;
create policy versions_delete_own on public.edit_versions for delete to authenticated using (owner_id = auth.uid());

drop policy if exists presets_select_own on public.user_presets;
create policy presets_select_own on public.user_presets for select to authenticated using (owner_id = auth.uid());
drop policy if exists presets_insert_own on public.user_presets;
create policy presets_insert_own on public.user_presets for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists presets_update_own on public.user_presets;
create policy presets_update_own on public.user_presets for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists presets_delete_own on public.user_presets;
create policy presets_delete_own on public.user_presets for delete to authenticated using (owner_id = auth.uid());

drop policy if exists exports_select_own on public.export_records;
create policy exports_select_own on public.export_records for select to authenticated using (owner_id = auth.uid());
drop policy if exists exports_insert_own on public.export_records;
create policy exports_insert_own on public.export_records for insert to authenticated with check (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);
drop policy if exists exports_update_own on public.export_records;
create policy exports_update_own on public.export_records for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists exports_delete_own on public.export_records;
create policy exports_delete_own on public.export_records for delete to authenticated using (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lumaforge-assets',
  'lumaforge-assets',
  false,
  52428800,
  array['image/jpeg','image/png','image/webp','image/tiff','image/heic','image/avif','application/json','application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists lumaforge_storage_select_own on storage.objects;
create policy lumaforge_storage_select_own on storage.objects for select to authenticated using (
  bucket_id = 'lumaforge-assets' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists lumaforge_storage_insert_own on storage.objects;
create policy lumaforge_storage_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'lumaforge-assets' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists lumaforge_storage_update_own on storage.objects;
create policy lumaforge_storage_update_own on storage.objects for update to authenticated using (
  bucket_id = 'lumaforge-assets' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'lumaforge-assets' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists lumaforge_storage_delete_own on storage.objects;
create policy lumaforge_storage_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'lumaforge-assets' and (storage.foldername(name))[1] = auth.uid()::text
);
