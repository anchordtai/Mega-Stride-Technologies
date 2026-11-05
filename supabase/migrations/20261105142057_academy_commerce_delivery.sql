begin;
-- Additive upgrade; existing enquiries, enrolments and payment history are preserved.
alter table public.transactions add column mode text not null default 'test' check(mode in ('test','live'));
alter table public.transactions add column customer_email text;
alter table public.transactions add column checkout_url text;
alter table public.transactions add column checkout_expires_at timestamptz;
create unique index transactions_open_checkout on public.transactions(user_id,course_id,mode) where status='pending';
alter table public.courses add column duration_text text not null default '' check(length(duration_text)<=120);
alter table public.courses add column objectives text not null default '' check(length(objectives)<=5000);
alter table public.courses add column prerequisites text not null default '' check(length(prerequisites)<=5000);

create table public.assessments(id uuid primary key default gen_random_uuid(),course_id uuid not null unique references public.courses(id),title text not null check(length(title) between 2 and 180),questions jsonb not null check(jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 1 and 50),pass_percent integer not null default 70 check(pass_percent between 1 and 100),max_attempts integer not null default 3 check(max_attempts between 1 and 10),published boolean not null default false,version integer not null default 1,updated_at timestamptz not null default now());
create table private.assessment_keys(assessment_id uuid primary key references public.assessments(id),answers jsonb not null check(jsonb_typeof(answers)='array'));
alter table private.assessment_keys enable row level security;
create table public.assessment_attempts(id uuid primary key default gen_random_uuid(),assessment_id uuid not null references public.assessments(id),user_id uuid not null references auth.users(id),version integer not null,attempt_no integer not null,score integer not null check(score between 0 and 100),passed boolean not null,submitted_at timestamptz not null default now(),unique(assessment_id,user_id,version,attempt_no));
create index assessment_attempts_user on public.assessment_attempts(user_id);
create table public.certificates(id uuid primary key default gen_random_uuid(),code text not null unique default replace(gen_random_uuid()::text,'-',''),user_id uuid not null references auth.users(id),course_id uuid not null references public.courses(id),holder_name text not null check(length(holder_name) between 2 and 120),course_title text not null,issued_at timestamptz not null default now(),revoked_at timestamptz,unique(user_id,course_id));
create index certificates_course on public.certificates(course_id);
create table public.support_tickets(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),subject text not null check(length(subject) between 3 and 180),body text not null check(length(body) between 10 and 5000),status text not null default 'open' check(status in ('open','in_progress','resolved')),created_at timestamptz not null default now());
create index support_tickets_user on public.support_tickets(user_id);
create table public.support_replies(id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.support_tickets(id),author_id uuid not null references auth.users(id),body text not null check(length(body) between 2 and 5000),created_at timestamptz not null default now());
create index support_replies_ticket on public.support_replies(ticket_id);
create index support_replies_author on public.support_replies(author_id);

alter table public.assessments enable row level security;
create policy assessments_read on public.assessments for select to authenticated using(private.has_role(array['admin','instructor']) or (published and private.course_access(course_id)));
alter table public.assessment_attempts enable row level security;
create policy attempts_read on public.assessment_attempts for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin','instructor']));
alter table public.certificates enable row level security;
create policy certificates_read on public.certificates for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin','staff','instructor']));
alter table public.support_tickets enable row level security;
create policy tickets_read on public.support_tickets for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin','staff']));
create policy tickets_create on public.support_tickets for insert to authenticated with check(user_id=(select auth.uid()) and status='open');
create policy tickets_staff_update on public.support_tickets for update to authenticated using(private.has_role(array['admin','staff'])) with check(private.has_role(array['admin','staff']));
alter table public.support_replies enable row level security;
create policy replies_read on public.support_replies for select to authenticated using(exists(select 1 from public.support_tickets t where t.id=ticket_id));
create policy replies_create on public.support_replies for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.support_tickets t where t.id=ticket_id));
grant select on public.assessments,public.assessment_attempts,public.certificates to authenticated;
grant select on public.support_tickets to authenticated;
grant select,insert on public.support_replies to authenticated;
grant update(status) on public.support_tickets to authenticated;
grant all on public.assessments,public.assessment_attempts,public.certificates,public.support_tickets,public.support_replies,private.assessment_keys to service_role;

-- Trusted server routines: no public/client execute, no answer keys in the Data API.
create function public.save_assessment(p_course uuid,p_title text,p_questions jsonb,p_answers jsonb,p_pass integer,p_attempts integer,p_published boolean) returns uuid language plpgsql security invoker set search_path='' as $$
declare aid uuid; q jsonb; idx integer:=0;
begin
 if jsonb_array_length(p_questions)<>jsonb_array_length(p_answers) then raise exception 'answer count';end if;
 for q in select value from jsonb_array_elements(p_questions) loop
  if jsonb_typeof(q->'options')<>'array' or jsonb_array_length(q->'options') not between 2 and 6 or length(q->>'prompt') not between 3 and 1000 or (p_answers->>idx)::integer not between 0 and jsonb_array_length(q->'options')-1 then raise exception 'invalid question';end if;
  idx:=idx+1;
 end loop;
 insert into public.assessments(course_id,title,questions,pass_percent,max_attempts,published) values(p_course,p_title,p_questions,p_pass,p_attempts,p_published)
 on conflict(course_id) do update set title=excluded.title,questions=excluded.questions,pass_percent=excluded.pass_percent,max_attempts=excluded.max_attempts,published=excluded.published,version=public.assessments.version+1,updated_at=now() returning id into aid;
 insert into private.assessment_keys values(aid,p_answers) on conflict(assessment_id) do update set answers=excluded.answers;
 return aid;
end $$;
create function public.grade_assessment(p_user uuid,p_assessment uuid,p_version integer,p_answers jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.assessments; key jsonb; n integer; score integer; correct integer:=0; j integer; prior jsonb;
begin
 select * into strict a from public.assessments where id=p_assessment and published for update;
 if a.version<>p_version then raise exception 'Assessment changed; refresh before submitting.';end if;
 if not exists(select 1 from public.enrolments where user_id=p_user and course_id=a.course_id and status in ('active','completed')) then raise exception 'No course access';end if;
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>jsonb_array_length(a.questions) then raise exception 'Complete all questions';end if;
 select answers into strict key from private.assessment_keys where assessment_id=a.id;
 select count(*) into n from public.assessment_attempts where user_id=p_user and assessment_id=a.id and version=a.version;
 if n>=a.max_attempts then raise exception 'Attempt limit reached';end if;
 for j in 0..jsonb_array_length(key)-1 loop
  if jsonb_typeof(p_answers->j)<>'number' or (p_answers->>j)::integer not between 0 and jsonb_array_length(a.questions->j->'options')-1 then raise exception 'Invalid answer';end if;
  if (p_answers->>j)::integer=(key->>j)::integer then correct:=correct+1;end if;
 end loop;
 score:=floor(100.0*correct/jsonb_array_length(key));
 insert into public.assessment_attempts(assessment_id,user_id,version,attempt_no,score,passed) values(a.id,p_user,a.version,n+1,score,score>=a.pass_percent);
 return jsonb_build_object('score',score,'passed',score>=a.pass_percent,'attempt',n+1);
end $$;
create function public.issue_certificate(p_user uuid,p_course uuid) returns text language plpgsql security invoker set search_path='' as $$
declare code_out text; holder text; title_out text; a public.assessments; total integer;
begin
 select title into strict title_out from public.courses where id=p_course and status='published' for update;
 if not exists(select 1 from public.enrolments where user_id=p_user and course_id=p_course and status in ('active','completed')) then raise exception 'No course access';end if;
 select display_name into holder from public.profiles where id=p_user;
 if length(coalesce(holder,''))<2 then raise exception 'Add your name to your learner profile first';end if;
 select count(*) into total from public.lessons where course_id=p_course and published;
 if total=0 or exists(select 1 from public.lessons l where l.course_id=p_course and l.published and not exists(select 1 from public.lesson_progress p where p.lesson_id=l.id and p.user_id=p_user)) then raise exception 'Complete all published lessons first';end if;
 select * into a from public.assessments where course_id=p_course and published;
 if a.id is null or not exists(select 1 from public.assessment_attempts where assessment_id=a.id and user_id=p_user and version=a.version and passed) then raise exception 'Pass the current course assessment first';end if;
 insert into public.certificates(user_id,course_id,holder_name,course_title) values(p_user,p_course,holder,title_out) on conflict(user_id,course_id) do nothing;
 select code into code_out from public.certificates where user_id=p_user and course_id=p_course and revoked_at is null;
 if code_out is null then raise exception 'Certificate requires staff review';end if;
 update public.enrolments set status='completed' where user_id=p_user and course_id=p_course and status='active';
 return code_out;
end $$;

create function public.begin_checkout(p_user uuid,p_course uuid,p_email text,p_mode text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.courses; t public.transactions;
begin
 if p_mode not in ('test','live') or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid checkout';end if;
 select * into strict c from public.courses where id=p_course and status='published' for update;
 if c.price_minor is null or c.price_minor<1 or c.price_minor>1000000000 or c.currency<>'NGN' then raise exception 'Course is not available for checkout';end if;
 if exists(select 1 from public.enrolments where user_id=p_user and course_id=p_course and status in ('active','completed','cancelled')) then raise exception 'Enrolment requires review or is already active';end if;
 update public.transactions set status='failed' where user_id=p_user and course_id=p_course and mode=p_mode and status='pending' and created_at<now()-interval '30 minutes';
 select * into t from public.transactions where user_id=p_user and course_id=p_course and mode=p_mode and status='pending';
 if found then return to_jsonb(t)||jsonb_build_object('created',false);end if;
 insert into public.transactions(user_id,course_id,provider,reference,amount_minor,currency,mode,customer_email) values(p_user,p_course,'paystack','MS-'||p_mode||'-'||replace(gen_random_uuid()::text,'-',''),c.price_minor,c.currency,p_mode,lower(p_email)) returning * into t;
 return to_jsonb(t)||jsonb_build_object('created',true);
end $$;
create function public.settle_payment(p_reference text,p_amount bigint,p_currency text,p_event text,p_mode text,p_email text) returns boolean language plpgsql security invoker set search_path='' as $$
declare t public.transactions;
begin
 select * into strict t from public.transactions where reference=p_reference and provider='paystack' for update;
 if p_amount is null or p_currency is null or p_mode is null or p_email is null or t.customer_email is null or t.amount_minor<>p_amount or t.currency<>p_currency or t.mode<>p_mode or lower(t.customer_email)<>lower(p_email) or coalesce(p_event,'')='' then raise exception 'Payment details mismatch';end if;
 if t.status='verified' then return true;end if;
 if t.status='refunded' then raise exception 'Refunded payment requires review';end if;
 update public.transactions set status='verified',verified_at=now(),provider_event_id=p_event where id=t.id;
 if t.mode='live' then
 insert into public.enrolments(user_id,course_id,status) values(t.user_id,t.course_id,'active') on conflict(user_id,course_id) do update set status='active' where public.enrolments.status='pending';
 end if;
 return true;
end $$;
create function public.enrol_free_course(p_user uuid,p_course uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.courses where id=p_course and status='published' and price_minor=0 for update;
 if not found then raise exception 'Free enrolment is not available';end if;
 insert into public.enrolments(user_id,course_id,status) values(p_user,p_course,'active') on conflict(user_id,course_id) do update set status='active' where public.enrolments.status='pending';
end $$;

create table public.email_jobs(id uuid primary key default gen_random_uuid(),dedupe_key text not null unique,kind text not null check(kind in ('enquiry_ack','staff_enquiry','payment_receipt','support_reply')),recipient text,payload jsonb not null default '{}',enquiry_id uuid references public.enquiries(id),user_id uuid references auth.users(id),status text not null default 'pending' check(status in ('pending','processing','accepted','failed','suppressed')),attempts integer not null default 0,first_attempt_at timestamptz,locked_at timestamptz,next_attempt_at timestamptz not null default now(),provider_id text unique,provider_status text,provider_event_at timestamptz,last_error text,created_at timestamptz not null default now());
create index email_jobs_queue on public.email_jobs(status,next_attempt_at);
create index email_jobs_enquiry on public.email_jobs(enquiry_id);
create index email_jobs_user on public.email_jobs(user_id);
alter table public.email_jobs enable row level security;
create policy email_jobs_staff_read on public.email_jobs for select to authenticated using(private.has_role(array['admin','staff']));
grant select on public.email_jobs to authenticated;
grant all on public.email_jobs to service_role;
create table private.email_events(id text primary key,created_at timestamptz not null default now());
alter table private.email_events enable row level security;
grant all on private.email_events to service_role;
create function private.enqueue_enquiry_email() returns trigger language plpgsql security definer set search_path='' as $$
declare e public.enquiries;
begin
 select * into strict e from public.enquiries where id=new.enquiry_id;
 insert into public.email_jobs(dedupe_key,kind,recipient,payload,enquiry_id,status) values
 ('enquiry/'||e.id||'/customer','enquiry_ack',e.email,jsonb_build_object('reference',e.reference,'name',e.name),e.id,case when e.email ~ '\.(test|invalid)$' then 'suppressed' else 'pending' end),
 ('enquiry/'||e.id||'/staff','staff_enquiry',null,jsonb_build_object('reference',e.reference),e.id,case when e.email ~ '\.(test|invalid)$' then 'suppressed' else 'pending' end) on conflict(dedupe_key) do nothing;
 return new;
end $$;
revoke all on function private.enqueue_enquiry_email() from public,anon,authenticated;
create trigger enquiry_email_jobs after insert on public.notification_outbox for each row execute function private.enqueue_enquiry_email();
create function private.enqueue_payment_email() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='verified' and old.status<>'verified' and new.mode='live' then
 insert into public.email_jobs(dedupe_key,kind,recipient,user_id,payload) values('payment/'||new.id,'payment_receipt',new.customer_email,new.user_id,jsonb_build_object('reference',new.reference,'amount_minor',new.amount_minor,'currency',new.currency)) on conflict(dedupe_key) do nothing;
 end if;return new;
end $$;
revoke all on function private.enqueue_payment_email() from public,anon,authenticated;
create trigger payment_email_jobs after update on public.transactions for each row execute function private.enqueue_payment_email();
create function public.claim_email_jobs() returns setof public.email_jobs language sql security invoker set search_path='' as $$
 with picked as(select id from public.email_jobs where attempts<8 and next_attempt_at<=now() and (attempts=0 or first_attempt_at>now()-interval '23 hours') and (status in ('pending','failed') or (status='processing' and locked_at<now()-interval '10 minutes')) order by created_at for update skip locked limit 5)
 update public.email_jobs j set status='processing',locked_at=now(),first_attempt_at=coalesce(first_attempt_at,now()),attempts=j.attempts+1 from picked p where j.id=p.id returning j.*;
$$;
create function public.record_email_event(p_id text,p_provider text,p_status text,p_at timestamptz) returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_status not in ('sent','delivered','delivery_delayed','bounced','complained','failed') then return;end if;
 insert into private.email_events(id) values(p_id) on conflict do nothing;
 if not found then return;end if;
 update public.email_jobs set provider_status=p_status,provider_event_at=p_at where provider_id=p_provider and (provider_event_at is null or provider_event_at<=p_at) and coalesce(provider_status,'') not in ('bounced','complained');
end $$;

revoke all on function public.save_assessment(uuid,text,jsonb,jsonb,integer,integer,boolean),public.grade_assessment(uuid,uuid,integer,jsonb),public.issue_certificate(uuid,uuid),public.begin_checkout(uuid,uuid,text,text),public.settle_payment(text,bigint,text,text,text,text),public.enrol_free_course(uuid,uuid),public.claim_email_jobs(),public.record_email_event(text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.save_assessment(uuid,text,jsonb,jsonb,integer,integer,boolean),public.grade_assessment(uuid,uuid,integer,jsonb),public.issue_certificate(uuid,uuid),public.begin_checkout(uuid,uuid,text,text),public.settle_payment(text,bigint,text,text,text,text),public.enrol_free_course(uuid,uuid),public.claim_email_jobs(),public.record_email_event(text,text,text,timestamptz) to service_role;

create function public.create_support_ticket(p_user uuid,p_subject text,p_body text) returns uuid language plpgsql security invoker set search_path='' as $$
declare hits integer; result uuid;
begin
 insert into private.rate_limits(key,window_start,hits) values('support/'||p_user,now(),1)
 on conflict(key) do update set hits=case when private.rate_limits.window_start<now()-interval '1 hour' then 1 else private.rate_limits.hits+1 end,window_start=case when private.rate_limits.window_start<now()-interval '1 hour' then now() else private.rate_limits.window_start end returning private.rate_limits.hits into hits;
 if hits>5 then raise exception 'Support request limit reached';end if;
 insert into public.support_tickets(user_id,subject,body) values(p_user,p_subject,p_body) returning id into result;return result;
end $$;
revoke all on function public.create_support_ticket(uuid,text,text) from public,anon,authenticated;
grant execute on function public.create_support_ticket(uuid,text,text) to service_role;
create function private.enqueue_support_reply() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient_email text;owner_id uuid;
begin
 if private.has_role(array['admin','staff']) then
 select t.user_id,u.email into owner_id,recipient_email from public.support_tickets t join auth.users u on u.id=t.user_id where t.id=new.ticket_id;
 if recipient_email is not null then insert into public.email_jobs(dedupe_key,kind,recipient,user_id,payload,status) values('support/'||new.id,'support_reply',recipient_email,owner_id,jsonb_build_object('ticket',new.ticket_id),case when recipient_email ~ '\.(test|invalid)$' then 'suppressed' else 'pending' end) on conflict(dedupe_key) do nothing;end if;
 end if;return new;
end $$;
revoke all on function private.enqueue_support_reply() from public,anon,authenticated;
create trigger support_reply_email after insert on public.support_replies for each row execute function private.enqueue_support_reply();
create trigger payment_audit after insert or update on public.transactions for each row execute function private.record_change();
create trigger certificate_audit after insert or update on public.certificates for each row execute function private.record_change();
create trigger assessment_audit after insert or update on public.assessments for each row execute function private.record_change();
create trigger support_audit after insert or update on public.support_tickets for each row execute function private.record_change();
commit;
