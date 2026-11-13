begin;
-- Narrow initial setup: this server-only check authorizes only an unclaimed,
-- privately designated owner address. General application signup stays off.
create function private.owner_signup_available(p_email text default null) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.academy_owners where bootstrap_enabled and user_id is null and (p_email is null or (length(p_email)<=254 and email=lower(btrim(p_email)))));
$$;
revoke all on function private.owner_signup_available(text) from public,anon,authenticated;
grant execute on function private.owner_signup_available(text) to service_role;
create function public.owner_signup_available(p_email text default null) returns boolean language sql stable security invoker set search_path='' as $$select private.owner_signup_available(p_email);$$;
revoke all on function public.owner_signup_available(text) from public,anon,authenticated;
grant execute on function public.owner_signup_available(text) to service_role;
commit;
