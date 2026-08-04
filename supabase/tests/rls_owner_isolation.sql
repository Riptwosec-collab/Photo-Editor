-- Run against a disposable Supabase database or inside CI.
-- The transaction is rolled back and leaves no test rows.

begin;

insert into public.projects (id, owner_id, local_id, name)
values
  ('10000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','rls-a','RLS A'),
  ('20000000-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','rls-b','RLS B');

set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('request.jwt.claim.role','authenticated',true);

do $$
declare
  visible_count integer;
  affected integer;
  blocked boolean := false;
begin
  select count(*) into visible_count
  from public.projects
  where local_id in ('rls-a','rls-b');

  if visible_count <> 1 then
    raise exception 'RLS select isolation failed: expected 1 visible row, got %', visible_count;
  end if;

  update public.projects set name='should-not-change' where local_id='rls-b';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS update isolation failed: modified % foreign rows', affected;
  end if;

  delete from public.projects where local_id='rls-b';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'RLS delete isolation failed: deleted % foreign rows', affected;
  end if;

  begin
    insert into public.projects (owner_id, local_id, name)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','rls-forbidden','Forbidden');
  exception when insufficient_privilege then
    blocked := true;
  end;

  if not blocked then
    raise exception 'RLS insert isolation failed: foreign owner insert succeeded';
  end if;
end $$;

reset role;
rollback;

select 'rls_owner_isolation_passed' as result;
