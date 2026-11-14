-- A service-only predicate avoids granting raw Auth account access to the
-- application service role. Identity must come from the validated server session.
create function private.account_is_verified(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select (coalesce((select auth.uid())=p_user,false)
   or current_setting('role',true)='service_role')
 and exists(select 1 from auth.users where id=p_user
   and email_confirmed_at is not null and not coalesce(is_anonymous,false))
$$;
revoke all on function private.account_is_verified(uuid) from public,anon,authenticated;
grant execute on function private.account_is_verified(uuid) to service_role;

-- Registration records intent only. Existing RLS and verified payment rules
-- continue to decide access to paid lessons, assessments and documents.
create or replace function public.register_academy_course(p_user uuid,p_course uuid) returns text
language plpgsql security invoker set search_path='' as $$
declare c public.courses; result text;
begin
 if not private.account_is_verified(p_user) then raise exception 'A verified account is required'; end if;
 select * into strict c from public.courses where id=p_course and status='published' for update;
 if c.price_minor is null or c.price_minor<0 or c.price_minor>1000000000 or c.currency<>'NGN' then raise exception 'Course fees require confirmation';end if;
 insert into public.enrolments(user_id,course_id,status) values(p_user,p_course,'pending') on conflict(user_id,course_id) do nothing;
 select status into strict result from public.enrolments where user_id=p_user and course_id=p_course for update;
 if result='cancelled' then raise exception 'Contact the Academy about the cancelled registration';end if;
 if c.price_minor=0 and result='pending' then
  perform public.enrol_free_course(p_user,p_course);
  result:='active';
 end if;
 return result;
end $$;
revoke all on function public.register_academy_course(uuid,uuid) from public,anon,authenticated;
grant execute on function public.register_academy_course(uuid,uuid) to service_role;
