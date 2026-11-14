-- Registration records intent only. Existing RLS and verified payment rules
-- continue to decide access to paid lessons, assessments and documents.
create function public.register_academy_course(p_user uuid,p_course uuid) returns text
language plpgsql security invoker set search_path='' as $$
declare c public.courses; result text;
begin
 if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'A verified account is required'; end if;
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
