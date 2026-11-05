begin;
create function public.claim_notifications() returns table(id uuid,reference text) language sql security invoker set search_path='' as $$
 with candidates as (
 select o.id from public.notification_outbox o
 where o.attempts<5 and (o.status in ('pending','failed') or (o.status='processing' and o.locked_at<now()-interval '15 minutes'))
 order by o.created_at for update skip locked limit 10
 ), claimed as (
 update public.notification_outbox o set status='processing',locked_at=now(),attempts=o.attempts+1 from candidates c where o.id=c.id returning o.id,o.enquiry_id
 ) select c.id,e.reference from claimed c join public.enquiries e on e.id=c.enquiry_id;
$$;
revoke all on function public.claim_notifications() from public,anon,authenticated;
grant execute on function public.claim_notifications() to service_role;
commit;
