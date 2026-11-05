-- Apply ONLY to a new, empty, dedicated Mega Stride Supabase project.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table private.staff_roles(user_id uuid primary key references auth.users(id) on delete cascade, role text not null check(role in ('admin','staff','editor','instructor')));
alter table private.staff_roles enable row level security;
-- Bootstrap/change staff membership only through trusted project administration.
create function private.has_role(roles text[]) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists(select 1 from private.staff_roles where user_id=(select auth.uid()) and role=any(roles));
$$;
revoke all on function private.has_role(text[]) from public, anon;
grant execute on function private.has_role(text[]) to authenticated;
create function private.my_staff_role() returns text language sql stable security definer set search_path='' as $$
 select role from private.staff_roles where (select auth.uid()) is not null and user_id=(select auth.uid());
$$;
revoke all on function private.my_staff_role() from public, anon;
grant execute on function private.my_staff_role() to authenticated;
create function public.my_staff_role() returns text language sql stable security invoker set search_path='' as $$ select private.my_staff_role(); $$;
revoke all on function public.my_staff_role() from public,anon;
grant execute on function public.my_staff_role() to authenticated;
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, display_name text not null check(length(display_name) between 1 and 120), phone text check(length(phone)<=40), created_at timestamptz not null default now());
create table public.content(id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('page','project','post','team','testimonial','service')), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), title text not null check(length(title) between 2 and 180), summary text not null default '' check(length(summary)<=500), body text not null check(length(body)<=50000), category text not null default '' check(length(category)<=100), status text not null default 'draft' check(status in ('draft','published','archived')), updated_at timestamptz not null default now(), created_by uuid references auth.users(id));
create table public.content_revisions(id bigint generated always as identity primary key, content_id uuid not null references public.content(id) on delete restrict, snapshot jsonb not null, recorded_at timestamptz not null default now(), actor uuid references auth.users(id));
create table public.enquiries(id uuid primary key default gen_random_uuid(), reference text not null unique default ('MS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))), kind text not null check(kind in ('contact','training','trade','quotation')), name text not null check(length(name) between 2 and 120), email text not null check(length(email)<=254 and position('@' in email)>1), company text not null default '' check(length(company)<=160), phone text not null default '' check(length(phone)<=40), country text not null check(length(country) between 2 and 80), service text not null check(length(service) between 2 and 120), subject text not null default '' check(length(subject)<=180), message text not null check(length(message) between 15 and 5000), details jsonb not null default '{}', status text not null default 'new' check(status in ('new','under_review','contacted','quotation_sent','negotiation','won','lost','closed')), assigned_to uuid references auth.users(id), follow_up_at timestamptz, consent_version text not null default 'privacy-2026-11-draft', created_at timestamptz not null default now());
create index enquiries_status_created on public.enquiries(status,created_at desc);
create index enquiries_assignment on public.enquiries(assigned_to);
create table public.enquiry_notes(id uuid primary key default gen_random_uuid(), enquiry_id uuid not null references public.enquiries(id) on delete restrict, body text not null check(length(body) between 1 and 5000), author_id uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now());
create index enquiry_notes_parent on public.enquiry_notes(enquiry_id);
create table public.courses(id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), title text not null check(length(title) between 2 and 180), description text not null check(length(description)<=15000), category text not null default '' check(length(category)<=100), price_minor bigint check(price_minor>=0), currency text not null default 'NGN' check(currency ~ '^[A-Z]{3}$'), starts_at timestamptz, status text not null default 'draft' check(status in ('draft','published','archived')), instructor_id uuid references auth.users(id), created_at timestamptz not null default now());
create index courses_instructor on public.courses(instructor_id);
create table public.enrolments(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict, course_id uuid not null references public.courses(id) on delete restrict, status text not null default 'pending' check(status in ('pending','active','completed','cancelled')), created_at timestamptz not null default now(), unique(user_id,course_id));
create index enrolments_course on public.enrolments(course_id);
create table public.lessons(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id) on delete restrict,title text not null check(length(title) between 2 and 180),body text not null check(length(body)<=50000),position integer not null check(position>=0),published boolean not null default false,unique(course_id,position));
create table public.lesson_progress(user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,lesson_id uuid not null references public.lessons(id) on delete restrict,completed_at timestamptz not null default now(),primary key(user_id,lesson_id));
create index lesson_progress_lesson on public.lesson_progress(lesson_id);
create table public.resources(id uuid primary key default gen_random_uuid(),lesson_id uuid not null references public.lessons(id) on delete restrict,title text not null check(length(title) between 1 and 180),object_path text not null unique,created_at timestamptz not null default now());
create index resources_lesson on public.resources(lesson_id);
create table public.quotations(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references public.enquiries(id) on delete restrict,number text not null unique default ('Q-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),currency text not null default 'NGN' check(currency ~ '^[A-Z]{3}$'),items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 50),total_minor bigint not null check(total_minor>=0),status text not null default 'draft' check(status in ('draft','approved','sent','accepted','declined','expired')),valid_until date not null,created_at timestamptz not null default now());
create index quotations_enquiry on public.quotations(enquiry_id);
create table public.transactions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),course_id uuid not null references public.courses(id),provider text not null check(provider in ('paystack','flutterwave','bank_transfer')),reference text not null unique,amount_minor bigint not null check(amount_minor>0),currency text not null check(currency ~ '^[A-Z]{3}$'),status text not null default 'pending' check(status in ('pending','verified','failed','refunded')),verified_at timestamptz,provider_event_id text unique,created_at timestamptz not null default now());
create index transactions_user on public.transactions(user_id);
create index transactions_course on public.transactions(course_id);
create table public.audit_logs(id bigint generated always as identity primary key,actor_id uuid,entity text not null,entity_id text not null,operation text not null,created_at timestamptz not null default now());
create table public.notification_outbox(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null unique references public.enquiries(id) on delete restrict,status text not null default 'pending' check(status in ('pending','processing','sent','failed')),attempts integer not null default 0 check(attempts>=0),locked_at timestamptz,sent_at timestamptz,last_error text,created_at timestamptz not null default now());
create table private.rate_limits(key text primary key,window_start timestamptz not null,hits integer not null);
alter table private.rate_limits enable row level security;

create function private.course_access(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and (private.has_role(array['admin','staff','instructor']) or exists(select 1 from public.enrolments where user_id=(select auth.uid()) and course_id=target and status in ('active','completed')));
$$;
revoke all on function private.course_access(uuid) from public,anon;
grant execute on function private.course_access(uuid) to authenticated;

-- Public data is published-only; operational data has no anonymous table access.
alter table public.profiles enable row level security;
create policy profiles_self_read on public.profiles for select to authenticated using(id=(select auth.uid()) or private.has_role(array['admin','staff']));
create policy profiles_self_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
alter table public.content enable row level security;
create policy content_public on public.content for select to anon,authenticated using(status='published');
create policy content_edit on public.content for all to authenticated using(private.has_role(array['admin','editor'])) with check(private.has_role(array['admin','editor']));
alter table public.content_revisions enable row level security;
create policy revisions_read on public.content_revisions for select to authenticated using(private.has_role(array['admin','editor']));
alter table public.enquiries enable row level security;
create policy enquiries_staff_read on public.enquiries for select to authenticated using(private.has_role(array['admin','staff']));
create policy enquiries_staff_update on public.enquiries for update to authenticated using(private.has_role(array['admin','staff'])) with check(private.has_role(array['admin','staff']));
alter table public.enquiry_notes enable row level security;
create policy notes_read on public.enquiry_notes for select to authenticated using(private.has_role(array['admin','staff']));
create policy notes_add on public.enquiry_notes for insert to authenticated with check(author_id=(select auth.uid()) and private.has_role(array['admin','staff']));
alter table public.courses enable row level security;
create policy courses_public on public.courses for select to anon,authenticated using(status='published');
create policy courses_manage on public.courses for all to authenticated using(private.has_role(array['admin','instructor'])) with check(private.has_role(array['admin','instructor']));
alter table public.enrolments enable row level security;
create policy enrolments_read on public.enrolments for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin','staff','instructor']));
create policy enrolments_manage on public.enrolments for all to authenticated using(private.has_role(array['admin','staff'])) with check(private.has_role(array['admin','staff']));
alter table public.lessons enable row level security;
create policy lessons_read on public.lessons for select to authenticated using(published and private.course_access(course_id));
create policy lessons_manage on public.lessons for all to authenticated using(private.has_role(array['admin','instructor'])) with check(private.has_role(array['admin','instructor']));
alter table public.lesson_progress enable row level security;
create policy progress_read on public.lesson_progress for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin','instructor']));
create policy progress_complete on public.lesson_progress for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.lessons where id=lesson_id and published and private.course_access(course_id)));
alter table public.resources enable row level security;
create policy resources_read on public.resources for select to authenticated using(exists(select 1 from public.lessons where id=lesson_id));
create policy resources_manage on public.resources for all to authenticated using(private.has_role(array['admin','instructor'])) with check(private.has_role(array['admin','instructor']));
alter table public.quotations enable row level security;
create policy quotes_read on public.quotations for select to authenticated using(private.has_role(array['admin','staff']));
create policy quotes_insert on public.quotations for insert to authenticated with check(private.has_role(array['admin','staff']) and status='draft');
create policy quotes_approve on public.quotations for update to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
alter table public.transactions enable row level security;
create policy transactions_read on public.transactions for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin','staff']));
-- No client may mark a transaction paid or refund it.
alter table public.audit_logs enable row level security;
create policy audit_admin_read on public.audit_logs for select to authenticated using(private.has_role(array['admin']));
alter table public.notification_outbox enable row level security;
-- Outbox only available to the trusted server worker.

revoke all on all tables in schema public from anon,authenticated;
grant select on public.content,public.courses to anon;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,update on public.content,public.courses,public.lessons,public.resources,public.enrolments to authenticated;
grant select,update on public.enquiries to authenticated;
grant select,insert on public.enquiry_notes,public.lesson_progress,public.quotations to authenticated;
grant update on public.quotations to authenticated;
grant select on public.content_revisions,public.transactions,public.audit_logs to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

create function private.record_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_logs(actor_id,entity,entity_id,operation) values(auth.uid(),tg_table_name,new.id::text,tg_op);
 if tg_table_name='content' and tg_op='UPDATE' then
   insert into public.content_revisions(content_id,snapshot,actor) values(old.id,to_jsonb(old),auth.uid());
   new.updated_at=now();
 end if;
 return new;
end $$;
revoke all on function private.record_change() from public,anon,authenticated;
create trigger content_audit before insert or update on public.content for each row execute function private.record_change();
create trigger enquiry_audit after insert or update on public.enquiries for each row execute function private.record_change();
create trigger course_audit after insert or update on public.courses for each row execute function private.record_change();
create trigger enrolment_audit after insert or update on public.enrolments for each row execute function private.record_change();
create trigger quote_audit after insert or update on public.quotations for each row execute function private.record_change();

-- Service-role only: atomic rate limiting, bounded input, enquiry and outbox in one transaction.
create function public.submit_enquiry(payload jsonb,rate_key text) returns text language plpgsql security invoker set search_path='' as $$
declare ref text; new_id uuid; hits integer;
begin
 if length(rate_key)<>64 then raise exception 'invalid rate key'; end if;
 insert into private.rate_limits(key,window_start,hits) values(rate_key,now(),1)
 on conflict(key) do update set hits=case when private.rate_limits.window_start < now()-interval '1 hour' then 1 else private.rate_limits.hits+1 end,
 window_start=case when private.rate_limits.window_start < now()-interval '1 hour' then now() else private.rate_limits.window_start end
 returning private.rate_limits.hits into hits;
 if hits>5 then raise exception 'rate limit exceeded'; end if;
 insert into public.enquiries(kind,name,email,company,phone,country,service,subject,message,details)
 values(payload->>'kind',payload->>'name',payload->>'email',coalesce(payload->>'company',''),coalesce(payload->>'phone',''),payload->>'country',payload->>'service',coalesce(payload->>'subject',''),payload->>'message',jsonb_build_object('product',left(payload->>'product',240),'quantity',left(payload->>'quantity',80),'destination',left(payload->>'destination',160),'timeframe',left(payload->>'timeframe',120))) returning reference,id into ref,new_id;
 insert into public.notification_outbox(enquiry_id) values(new_id);
 return ref;
end $$;
revoke all on function public.submit_enquiry(jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_enquiry(jsonb,text) to service_role;
grant usage on schema private to service_role;
grant all on private.rate_limits to service_role;

-- Private learning material; uploads restricted to PDF and 10 MiB.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('academy-resources','academy-resources',false,10485760,array['application/pdf']);
create policy academy_staff_upload on storage.objects for insert to authenticated with check(bucket_id='academy-resources' and private.has_role(array['admin','instructor']));
create policy academy_staff_delete on storage.objects for delete to authenticated using(bucket_id='academy-resources' and private.has_role(array['admin','instructor']));
create policy academy_resource_read on storage.objects for select to authenticated using(bucket_id='academy-resources' and (private.has_role(array['admin','instructor']) or exists(select 1 from public.resources r join public.lessons l on l.id=r.lesson_id where r.object_path=name and l.published and private.course_access(l.course_id))));
commit;
