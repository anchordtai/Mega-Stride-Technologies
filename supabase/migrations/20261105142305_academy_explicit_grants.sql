begin;
-- Supabase public-schema default grants vary by project. RLS is necessary,
-- and explicit minimal grants also remove unused structural privileges.
revoke all on public.assessments,public.assessment_attempts,public.certificates,public.support_tickets,public.support_replies,public.email_jobs from anon,authenticated;
revoke all on private.assessment_keys,private.email_events from public,anon,authenticated;
grant select on public.assessments,public.assessment_attempts,public.certificates,public.support_tickets,public.support_replies,public.email_jobs to authenticated;
grant insert on public.support_replies to authenticated;
grant update(status) on public.support_tickets to authenticated;
commit;
