begin;
create function private.my_learning_access(p_course uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and private.learner_entitled((select auth.uid()),p_course);
$$;
revoke all on function private.my_learning_access(uuid) from public,anon;
grant execute on function private.my_learning_access(uuid) to authenticated;
create or replace function public.my_learning_access(p_course uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select private.my_learning_access(p_course);
$$;
revoke all on function public.my_learning_access(uuid) from public,anon;
grant execute on function public.my_learning_access(uuid) to authenticated;
commit;
