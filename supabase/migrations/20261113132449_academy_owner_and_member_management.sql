begin;
-- The owner address was explicitly selected by the website owner. No unverified
-- identity, signup metadata or public role selector can claim this membership.
create table private.academy_owners(email text primary key check(email=lower(email)),user_id uuid unique references auth.users(id),claimed_at timestamptz,bootstrap_enabled boolean not null default false);
-- Seed the designated owner address separately through trusted project
-- administration; account identifiers do not belong in this public source tree.
alter table private.academy_owners enable row level security;
revoke all on private.academy_owners from public,anon,authenticated;
create table private.academy_admin_changes(id uuid primary key default gen_random_uuid(),actor_id uuid not null references auth.users(id),target_id uuid references auth.users(id),course_id uuid references public.courses(id),action text not null,before_data jsonb,after_data jsonb,reason text not null check(length(btrim(reason)) between 20 and 2000),created_at timestamptz not null default now());
alter table private.academy_admin_changes enable row level security;
revoke all on private.academy_admin_changes from public,anon,authenticated;
create index academy_admin_changes_actor on private.academy_admin_changes(actor_id);
create index academy_admin_changes_target on private.academy_admin_changes(target_id);
create index academy_admin_changes_course on private.academy_admin_changes(course_id);
create table public.instructor_requests(user_id uuid primary key references auth.users(id) on delete cascade,notes text not null default '' check(length(notes)<=2000),status text not null default 'pending' check(status in ('pending','approved','declined')),requested_at timestamptz not null default now(),reviewed_by uuid references auth.users(id),reviewed_at timestamptz);
alter table public.instructor_requests enable row level security;
revoke all on public.instructor_requests from public,anon,authenticated;
grant all on public.instructor_requests to service_role;
grant select,insert on public.instructor_requests to authenticated;
create policy instructor_request_read on public.instructor_requests for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin']));
create policy instructor_request_submit on public.instructor_requests for insert to authenticated with check(user_id=(select auth.uid()) and status='pending' and reviewed_by is null and reviewed_at is null);
create index instructor_requests_reviewer on public.instructor_requests(reviewed_by);

create function private.academy_super_admin(p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_actor is not null and exists(select 1 from private.academy_owners o join auth.users u on u.id=o.user_id where o.user_id=p_actor and lower(u.email)=o.email and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false));
$$;
revoke all on function private.academy_super_admin(uuid) from public,anon,authenticated;
grant execute on function private.academy_super_admin(uuid) to service_role;
create function private.my_academy_owner_status() returns boolean language sql stable security definer set search_path='' as $$ select private.academy_super_admin((select auth.uid())); $$;
revoke all on function private.my_academy_owner_status() from public,anon;
grant execute on function private.my_academy_owner_status() to authenticated,service_role;
create function public.my_academy_owner_status() returns boolean language sql stable security invoker set search_path='' as $$ select private.my_academy_owner_status(); $$;
revoke all on function public.my_academy_owner_status() from public,anon;
grant execute on function public.my_academy_owner_status() to authenticated,service_role;

create function private.claim_academy_owner(p_user uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare o private.academy_owners; first_claim boolean;
begin
 select a.* into o from private.academy_owners a join auth.users u on lower(u.email)=a.email where a.bootstrap_enabled and u.id=p_user and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) for update of a;
 if not found then return false;end if;
 if o.user_id is not null and o.user_id<>p_user then raise exception 'Owner identity requires project administration';end if;
 first_claim:=o.user_id is null;
 update private.academy_owners set user_id=p_user,claimed_at=coalesce(claimed_at,now()) where email=o.email;
 insert into private.staff_roles(user_id,role) values(p_user,'admin') on conflict(user_id) do update set role='admin' where private.staff_roles.role<>'admin';
 if first_claim then insert into private.academy_admin_changes(actor_id,target_id,action,after_data,reason) values(p_user,p_user,'owner_claim',jsonb_build_object('role','super_admin'),'Verified owner email claimed the explicitly designated Academy owner account.');end if;
 return true;
end $$;
create function public.claim_academy_owner(p_user uuid) returns boolean language sql security invoker set search_path='' as $$select private.claim_academy_owner(p_user);$$;
revoke all on function private.claim_academy_owner(uuid),public.claim_academy_owner(uuid) from public,anon,authenticated;
grant execute on function private.claim_academy_owner(uuid),public.claim_academy_owner(uuid) to service_role;

create function private.academy_members(p_actor uuid,p_query text,p_role text,p_page integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; total integer; page_no integer; member_rows jsonb;
begin
 if not private.academy_super_admin(p_actor) then raise exception 'Super administrator required';end if;
 if length(coalesce(p_query,''))>100 or p_role not in ('all','student','instructor','admin','staff','editor','super_admin') or p_page not between 1 and 100000 then raise exception 'Invalid filter';end if;
 with members as (select u.id,u.email,p.display_name,u.created_at,u.email_confirmed_at is not null as verified,case when o.user_id is not null then 'super_admin' else coalesce(r.role,'student') end as role from auth.users u left join public.profiles p on p.id=u.id left join private.staff_roles r on r.user_id=u.id left join private.academy_owners o on o.user_id=u.id)
 select count(*) into total from members where (p_role='all' or role=p_role) and (coalesce(p_query,'')='' or email ilike '%'||p_query||'%' or display_name ilike '%'||p_query||'%');
 page_no:=least(p_page,greatest(1,ceil(total/25.0)::integer));
 with members as (select u.id,u.email,p.display_name,u.created_at,u.email_confirmed_at is not null as verified,case when o.user_id is not null then 'super_admin' else coalesce(r.role,'student') end as role,(select count(*) from public.enrolments e where e.user_id=u.id) as enrolments from auth.users u left join public.profiles p on p.id=u.id left join private.staff_roles r on r.user_id=u.id left join private.academy_owners o on o.user_id=u.id), selected as (select * from members where (p_role='all' or role=p_role) and (coalesce(p_query,'')='' or email ilike '%'||p_query||'%' or display_name ilike '%'||p_query||'%') order by created_at desc,id limit 25 offset (page_no-1)*25)
 select coalesce(jsonb_agg(to_jsonb(selected)),'[]'::jsonb) into member_rows from selected;
 select jsonb_build_object('members',member_rows,'total',total,'page',page_no,'pages',greatest(1,ceil(total/25.0)::integer),
 'stats',jsonb_build_object('accounts',(select count(*) from auth.users),'instructors',(select count(*) from private.staff_roles where role='instructor'),'students',(select count(*) from auth.users u where not exists(select 1 from private.staff_roles r where r.user_id=u.id)),'courses',(select count(*) from public.courses),'requests',(select count(*) from public.instructor_requests where status='pending')),
 'courses',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'status',c.status,'instructor_id',c.instructor_id,'enrolments',(select count(*) from public.enrolments e where e.course_id=c.id)) order by c.title),'[]'::jsonb) from public.courses c),
 'instructors',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (select u.id,u.email,p.display_name from auth.users u join private.staff_roles r on r.user_id=u.id left join public.profiles p on p.id=u.id where r.role in ('instructor','admin') and u.email_confirmed_at is not null order by u.email limit 200) t),
 'requests',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (select r.user_id,u.email,r.notes,r.requested_at from public.instructor_requests r join auth.users u on u.id=r.user_id where r.status='pending' order by r.requested_at limit 50) t),
 'changes',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (select action,reason,created_at,target_id,course_id from private.academy_admin_changes order by created_at desc,id limit 20) t)) into result;
 return result;
end $$;
create function public.academy_members(p_actor uuid,p_query text default '',p_role text default 'all',p_page integer default 1) returns jsonb language sql security invoker set search_path='' as $$select private.academy_members(p_actor,p_query,p_role,p_page);$$;
revoke all on function private.academy_members(uuid,text,text,integer),public.academy_members(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function private.academy_members(uuid,text,text,integer),public.academy_members(uuid,text,text,integer) to service_role;

create function private.change_academy_role(p_actor uuid,p_target uuid,p_role text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare old_role text;
begin
 if not private.academy_super_admin(p_actor) then raise exception 'Super administrator required';end if;
 if p_role not in ('student','instructor','admin','staff','editor') or length(btrim(coalesce(p_reason,''))) not between 20 and 2000 then raise exception 'Role and reason required';end if;
 perform 1 from auth.users where id=p_target for update;
 if not found then raise exception 'Account not found';end if;
 if exists(select 1 from private.academy_owners where user_id=p_target) then raise exception 'Owner role is protected';end if;
 if p_role<>'student' and not exists(select 1 from auth.users where id=p_target and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Verify this account email before assigning a staff role';end if;
 select coalesce(role,'student') into old_role from private.staff_roles where user_id=p_target;
 if p_role='student' then delete from private.staff_roles where user_id=p_target;else insert into private.staff_roles values(p_target,p_role) on conflict(user_id) do update set role=excluded.role;end if;
 if p_role not in ('instructor','admin') then update public.courses set instructor_id=null where instructor_id=p_target;end if;
 update public.instructor_requests set status=case when p_role='instructor' then 'approved' else 'declined' end,reviewed_by=p_actor,reviewed_at=now() where user_id=p_target;
 insert into private.academy_admin_changes(actor_id,target_id,action,before_data,after_data,reason) values(p_actor,p_target,'role_change',jsonb_build_object('role',coalesce(old_role,'student')),jsonb_build_object('role',p_role),p_reason);
end $$;
create function public.change_academy_role(p_actor uuid,p_target uuid,p_role text,p_reason text) returns void language sql security invoker set search_path='' as $$select private.change_academy_role(p_actor,p_target,p_role,p_reason);$$;
revoke all on function private.change_academy_role(uuid,uuid,text,text),public.change_academy_role(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function private.change_academy_role(uuid,uuid,text,text),public.change_academy_role(uuid,uuid,text,text) to service_role;

create function private.assign_academy_instructor(p_actor uuid,p_course uuid,p_target uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare previous uuid;
begin
 if not private.academy_super_admin(p_actor) or length(btrim(coalesce(p_reason,''))) not between 20 and 2000 then raise exception 'Super administrator and reason required';end if;
 if p_target is not null and not exists(select 1 from private.staff_roles r join auth.users u on u.id=r.user_id where r.user_id=p_target and r.role in ('instructor','admin') and u.email_confirmed_at is not null) then raise exception 'Verified instructor or administrator required';end if;
 select instructor_id into previous from public.courses where id=p_course for update;
 if not found then raise exception 'Course not found';end if;
 update public.courses set instructor_id=p_target where id=p_course;
 insert into private.academy_admin_changes(actor_id,target_id,course_id,action,before_data,after_data,reason) values(p_actor,p_target,p_course,'instructor_assignment',jsonb_build_object('instructor_id',previous),jsonb_build_object('instructor_id',p_target),p_reason);
end $$;
create function public.assign_academy_instructor(p_actor uuid,p_course uuid,p_target uuid,p_reason text) returns void language sql security invoker set search_path='' as $$select private.assign_academy_instructor(p_actor,p_course,p_target,p_reason);$$;
revoke all on function private.assign_academy_instructor(uuid,uuid,uuid,text),public.assign_academy_instructor(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function private.assign_academy_instructor(uuid,uuid,uuid,text),public.assign_academy_instructor(uuid,uuid,uuid,text) to service_role;

create function private.manage_academy_enrolment(p_actor uuid,p_target uuid,p_course uuid,p_status text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.academy_super_admin(p_actor) or length(btrim(coalesce(p_reason,''))) not between 20 and 2000 or p_status not in ('pending','active','completed','cancelled') then raise exception 'Super administrator, status and reason required';end if;
 if not exists(select 1 from auth.users where id=p_target and email_confirmed_at is not null) then raise exception 'Verified learner required';end if;
 insert into public.enrolments(user_id,course_id,status) values(p_target,p_course,p_status) on conflict(user_id,course_id) do update set status=excluded.status;
 insert into private.academy_admin_changes(actor_id,target_id,course_id,action,after_data,reason) values(p_actor,p_target,p_course,'enrolment_change',jsonb_build_object('status',p_status),p_reason);
end $$;
create function public.manage_academy_enrolment(p_actor uuid,p_target uuid,p_course uuid,p_status text,p_reason text) returns void language sql security invoker set search_path='' as $$select private.manage_academy_enrolment(p_actor,p_target,p_course,p_status,p_reason);$$;
revoke all on function private.manage_academy_enrolment(uuid,uuid,uuid,text,text),public.manage_academy_enrolment(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function private.manage_academy_enrolment(uuid,uuid,uuid,text,text),public.manage_academy_enrolment(uuid,uuid,uuid,text,text) to service_role;

create function private.set_owner_course_test(p_actor uuid,p_enabled boolean) returns integer language plpgsql security definer set search_path='' as $$
declare c record; n integer:=0;
begin
 if not private.academy_super_admin(p_actor) or p_enabled is null then raise exception 'Super administrator required';end if;
 for c in select id from public.courses where academy_code is not null and status='published' loop
  if p_enabled then insert into public.enrolments(user_id,course_id,status) values(p_actor,c.id,'active') on conflict(user_id,course_id) do update set status='active' where public.enrolments.status<>'completed';end if;
  perform public.set_learning_override(p_actor,p_actor,c.id,'Owner requested Academy evaluation access; audited exception, not a payment or receipt.',not p_enabled);
  n:=n+1;
 end loop;
 insert into private.academy_admin_changes(actor_id,target_id,action,after_data,reason) values(p_actor,p_actor,'owner_test_access',jsonb_build_object('courses',n,'enabled',p_enabled),'Owner changed personal Academy test access; no payment record is created.');
 return n;
end $$;
create function public.set_owner_course_test(p_actor uuid,p_enabled boolean) returns integer language sql security invoker set search_path='' as $$select private.set_owner_course_test(p_actor,p_enabled);$$;
revoke all on function private.set_owner_course_test(uuid,boolean),public.set_owner_course_test(uuid,boolean) from public,anon,authenticated;
grant execute on function private.set_owner_course_test(uuid,boolean),public.set_owner_course_test(uuid,boolean) to service_role;
commit;
