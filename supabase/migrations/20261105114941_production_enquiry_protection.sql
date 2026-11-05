begin;
alter table public.enquiries add column submission_key text unique check(submission_key is null or submission_key ~ '^[a-f0-9]{48}$');
create or replace function public.submit_enquiry(payload jsonb,rate_key text) returns text language plpgsql security invoker set search_path='' as $$
declare ref text; new_id uuid; request_hits integer; current_key text; max_hits integer; submission text;
begin
 if length(rate_key)<>64 then raise exception 'invalid rate key'; end if;
 submission=nullif(payload->>'submission_key','');
 if submission is not null then
  select reference into ref from public.enquiries where submission_key=submission;
  if found then return ref; end if;
 end if;
 -- Independent caps for source address, email identity and total site volume.
 foreach current_key in array array[rate_key,'email:'||md5(lower(payload->>'email')),'global:enquiries'] loop
  max_hits=case when current_key='global:enquiries' then 100 else 5 end;
  insert into private.rate_limits(key,window_start,hits) values(current_key,now(),1)
  on conflict(key) do update set hits=case when private.rate_limits.window_start < now()-interval '1 hour' then 1 else private.rate_limits.hits+1 end,
  window_start=case when private.rate_limits.window_start < now()-interval '1 hour' then now() else private.rate_limits.window_start end
  returning private.rate_limits.hits into request_hits;
  if request_hits>max_hits then raise exception 'rate limit exceeded'; end if;
 end loop;
 insert into public.enquiries(kind,name,email,company,phone,country,service,subject,message,details,submission_key)
 values(payload->>'kind',payload->>'name',payload->>'email',coalesce(payload->>'company',''),coalesce(payload->>'phone',''),payload->>'country',payload->>'service',coalesce(payload->>'subject',''),payload->>'message',jsonb_build_object('product',left(payload->>'product',240),'quantity',left(payload->>'quantity',80),'destination',left(payload->>'destination',160),'timeframe',left(payload->>'timeframe',120)),submission)
 on conflict(submission_key) do nothing returning reference,id into ref,new_id;
 if new_id is null then select reference into ref from public.enquiries where submission_key=submission; return ref; end if;
 insert into public.notification_outbox(enquiry_id) values(new_id);
 return ref;
end $$;
revoke all on function public.submit_enquiry(jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_enquiry(jsonb,text) to service_role;
commit;
