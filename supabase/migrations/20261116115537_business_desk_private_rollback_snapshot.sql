-- Migration rollback snapshot retained in this same database only.
-- Contains application tables and DDL metadata; never returns application rows.
-- Not a provider disaster-recovery backup: Auth credentials and Storage bytes
-- remain in their existing managed services and are not copied or exported.
set local lock_timeout='5s';
set local statement_timeout='60s';
do $guard$ begin
 if to_regclass('public.msbd_documents') is not null then
  raise exception 'Business Desk is already installed; stop preflight';
 end if;
 if (select coalesce(sum(pg_total_relation_size(c.oid)),0) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r')>20000000 then
  raise exception 'Application snapshot exceeds reviewed size; stop for review';
 end if;
end $guard$;
create schema msbd_rollback_20261116;
revoke all on schema msbd_rollback_20261116 from public,anon,authenticated,service_role;
create table msbd_rollback_20261116.manifest(source_schema text not null,source_table text not null,snapshot_table text not null,row_count bigint not null,row_digest text not null,created_at timestamptz not null default now(),primary key(source_schema,source_table));
create table msbd_rollback_20261116.catalog(kind text not null,identity text not null,definition jsonb not null,primary key(kind,identity));
alter table msbd_rollback_20261116.manifest enable row level security;
alter table msbd_rollback_20261116.catalog enable row level security;
revoke all on all tables in schema msbd_rollback_20261116 from public,anon,authenticated,service_role;
do $snapshot$
declare t record; names text; dest text; source_count bigint;copy_count bigint;source_hash text;copy_hash text;restored_hash text;
begin
 select string_agg(format('%I.%I',n.nspname,c.relname),',' order by n.nspname,c.relname) into names
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r';
 execute 'lock table '||names||' in share mode';
 for t in select n.nspname,c.relname,c.oid,c.relowner,c.relacl,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r' order by n.nspname,c.relname loop
  dest:=t.nspname||'__'||t.relname;
  execute format('create table msbd_rollback_20261116.%I as table %I.%I',dest,t.nspname,t.relname);
  execute format('alter table msbd_rollback_20261116.%I enable row level security',dest);
  execute format('revoke all on table msbd_rollback_20261116.%I from public,anon,authenticated,service_role',dest);
  execute format('select count(*),md5(coalesce(string_agg(to_jsonb(x)::text,chr(10) order by to_jsonb(x)::text),'''')) from %I.%I x',t.nspname,t.relname) into source_count,source_hash;
  execute format('select count(*),md5(coalesce(string_agg(to_jsonb(x)::text,chr(10) order by to_jsonb(x)::text),'''')) from msbd_rollback_20261116.%I x',dest) into copy_count,copy_hash;
  if source_count<>copy_count or source_hash<>copy_hash then raise exception 'Snapshot verification failed';end if;
  -- Restore each retained row set into a disposable temporary relation, then
  -- compare the full row digest. No production relation is overwritten.
  execute format('create temporary table msbd_restore_probe as table msbd_rollback_20261116.%I',dest);
  select md5(coalesce(string_agg(to_jsonb(x)::text,chr(10) order by to_jsonb(x)::text),'')) into restored_hash from pg_temp.msbd_restore_probe x;
  if restored_hash<>source_hash then raise exception 'Restore probe verification failed';end if;
  drop table pg_temp.msbd_restore_probe;
  insert into msbd_rollback_20261116.manifest values(t.nspname,t.relname,dest,copy_count,copy_hash,now());
  insert into msbd_rollback_20261116.catalog values('table',format('%I.%I',t.nspname,t.relname),jsonb_build_object('owner',pg_get_userbyid(t.relowner),'acl',t.relacl,'rls',t.relrowsecurity,'force_rls',t.relforcerowsecurity,
   'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'default',pg_get_expr(d.adbin,d.adrelid)) order by a.attnum) from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=t.oid and a.attnum>0 and not a.attisdropped),
   'constraints',(select coalesce(jsonb_agg(jsonb_build_object('name',conname,'definition',pg_get_constraintdef(oid,true))),'[]') from pg_constraint where conrelid=t.oid),
   'indexes',(select coalesce(jsonb_agg(pg_get_indexdef(indexrelid)),'[]') from pg_index where indrelid=t.oid),
   'triggers',(select coalesce(jsonb_agg(pg_get_triggerdef(oid,true)),'[]') from pg_trigger where tgrelid=t.oid and not tgisinternal)));
 end loop;
 insert into msbd_rollback_20261116.catalog
 select 'function',p.oid::regprocedure::text,jsonb_build_object('definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',p.proacl)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f';
 insert into msbd_rollback_20261116.catalog select 'policy',schemaname||'.'||tablename||'.'||policyname,to_jsonb(p) from pg_policies p where schemaname in ('public','private');
 insert into msbd_rollback_20261116.catalog select 'sequence',schemaname||'.'||sequencename,to_jsonb(s) from pg_sequences s where schemaname in ('public','private');
end $snapshot$;
revoke all on all tables in schema msbd_rollback_20261116 from public,anon,authenticated,service_role;

