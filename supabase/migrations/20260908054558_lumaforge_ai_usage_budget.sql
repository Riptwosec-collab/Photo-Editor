-- Additive, LumaForge-only ledger. No image bytes, prompts, or access tokens are stored.
create table public.lumaforge_ai_usage (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 kind text not null check(kind in ('background','inpaint','selection')),
 fingerprint text not null check(fingerprint ~ '^[0-9a-f]{64}$'),
 reserved_cents integer not null check(reserved_cents > 0),
 provider_id text,
 status text not null default 'reserved' check(status in ('reserved','starting','processing','succeeded','failed','canceled','unknown'))
);
create index lumaforge_ai_usage_owner_date on public.lumaforge_ai_usage(owner_id,created_at desc);
create index lumaforge_ai_usage_date on public.lumaforge_ai_usage(created_at);
alter table public.lumaforge_ai_usage enable row level security;
revoke all on public.lumaforge_ai_usage from anon,authenticated;
grant select on public.lumaforge_ai_usage to authenticated;
grant all on public.lumaforge_ai_usage to service_role;
create policy lumaforge_ai_usage_read_own on public.lumaforge_ai_usage for select to authenticated using (owner_id = (select auth.uid()));
create function public.lumaforge_reserve_ai(p_id uuid,p_owner uuid,p_kind text,p_fingerprint text,p_cents integer,p_daily_cents integer,p_daily_jobs integer)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare spent bigint; jobs bigint;
begin
 if p_cents is null or p_daily_cents is null or p_daily_jobs is null or p_cents<1 or p_daily_cents<1 or p_daily_jobs<1 then raise exception 'AI budget is not configured'; end if;
 -- Serialize reservations across all accounts and all app instances for the UTC day.
 perform pg_catalog.pg_advisory_xact_lock(729394828);
 select coalesce(sum(reserved_cents),0), count(*) filter(where owner_id=p_owner) into spent,jobs
 from public.lumaforge_ai_usage where created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 if spent+p_cents>p_daily_cents or jobs>=p_daily_jobs then raise exception 'Daily AI allowance reached'; end if;
 insert into public.lumaforge_ai_usage(id,owner_id,kind,fingerprint,reserved_cents) values(p_id,p_owner,p_kind,p_fingerprint,p_cents);
 return p_id;
end;
$$;
revoke all on function public.lumaforge_reserve_ai(uuid,uuid,text,text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.lumaforge_reserve_ai(uuid,uuid,text,text,integer,integer,integer) to service_role;
