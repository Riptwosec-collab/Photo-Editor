-- Behavioral verification; all synthetic users, projects and reservations are rolled back.
begin;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); project_id uuid:=gen_random_uuid(); receipt uuid:=gen_random_uuid(); n integer; denied boolean:=false;
begin
 insert into auth.users(id) values(a),(b);
 insert into public.projects(id,owner_id,name) values(project_id,a,'LumaForge rollback verification');
 perform set_config('role','service_role',true);
 perform public.lumaforge_reserve_ai(receipt,a,'selection',repeat('a',64),10,100,1);
 begin perform public.lumaforge_reserve_ai(gen_random_uuid(),a,'selection',repeat('b',64),10,100,1); exception when others then denied:=position('allowance' in SQLERRM)>0; end;
 if not denied then raise exception 'Per-user allowance was not enforced'; end if;
 denied:=false;
 begin perform public.lumaforge_reserve_ai(gen_random_uuid(),b,'selection',repeat('b',64),95,100,5); exception when others then denied:=position('allowance' in SQLERRM)>0; end;
 if not denied then raise exception 'Shared budget was not enforced'; end if;
 perform set_config('role','authenticated',true);
 perform set_config('request.jwt.claim.sub',a::text,true);
 select count(*) into n from public.projects where id=project_id;
 if n<>1 then raise exception 'Owner cannot read project'; end if;
 select count(*) into n from public.lumaforge_ai_usage where id=receipt;
 if n<>1 then raise exception 'Owner cannot read usage'; end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 select count(*) into n from public.projects where id=project_id;
 if n<>0 then raise exception 'Cross-owner project exposure'; end if;
 select count(*) into n from public.lumaforge_ai_usage where id=receipt;
 if n<>0 then raise exception 'Cross-owner usage exposure'; end if;
 update public.projects set name='Unauthorized update' where id=project_id;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Cross-owner write allowed'; end if;
 if has_function_privilege('authenticated','public.lumaforge_reserve_ai(uuid,uuid,text,text,integer,integer,integer)','EXECUTE') then raise exception 'Authenticated role can reserve arbitrary budget'; end if;
 if has_function_privilege('anon','public.lumaforge_reserve_ai(uuid,uuid,text,text,integer,integer,integer)','EXECUTE') then raise exception 'Anonymous role can reserve budget'; end if;
 perform set_config('role','postgres',true);
end;
$$;
rollback;
select 'Owner isolation, write denial, shared budget and per-user limits verified; test data rolled back' as result;
