begin;
-- Additive LMS foundation. No existing academic records are removed.
alter table public.courses add column academy_code text unique check(academy_code in ('cloud','marketing','networking','project-management','ai-automation'));
alter table public.courses add column academic_status text not null default 'draft' check(academic_status in ('draft','review','approved'));
alter table public.courses add constraint academy_fixed_fee check(academy_code is null or (price_minor is not null and price_minor=1500000 and currency='NGN'));
alter table public.courses add constraint academy_publication_review check(academy_code is null or status<>'published' or academic_status='approved');
create index if not exists courses_instructor on public.courses(instructor_id);

create table private.learning_overrides(user_id uuid not null references auth.users(id),course_id uuid not null references public.courses(id),actor_id uuid not null references auth.users(id),reason text not null check(length(reason) between 20 and 2000),granted_at timestamptz not null default now(),revoked_at timestamptz,primary key(user_id,course_id));
alter table private.learning_overrides enable row level security;
create index learning_overrides_course on private.learning_overrides(course_id);
create index learning_overrides_actor on private.learning_overrides(actor_id);
revoke all on private.learning_overrides from public,anon,authenticated;
grant all on private.learning_overrides to service_role;
grant select on private.staff_roles to service_role;
create function private.teaches_course(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and (private.has_role(array['admin']) or (private.has_role(array['instructor']) and exists(select 1 from public.courses c where c.id=target and c.instructor_id=(select auth.uid()))));
$$;
revoke all on function private.teaches_course(uuid) from public,anon;
grant execute on function private.teaches_course(uuid) to authenticated,service_role;
-- Internal predicate takes an arbitrary user only for trusted service routines; clients cannot call it.
create function private.learner_entitled(p_user uuid,p_course uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select p_user is not null and exists(select 1 from public.courses c join public.enrolments e on e.course_id=c.id where c.id=p_course and c.status='published' and e.user_id=p_user and e.status in ('active','completed') and (
 c.price_minor=0 or exists(select 1 from public.transactions t where t.user_id=p_user and t.course_id=c.id and t.status='verified' and t.provider='paystack' and t.mode='live' and t.amount_minor>0 and t.currency=c.currency)
 or exists(select 1 from private.learning_overrides o where o.user_id=p_user and o.course_id=c.id and o.revoked_at is null)));
$$;
revoke all on function private.learner_entitled(uuid,uuid) from public,anon,authenticated;
grant execute on function private.learner_entitled(uuid,uuid) to service_role;
create or replace function private.course_access(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and (private.teaches_course(target) or private.learner_entitled((select auth.uid()),target));
$$;
create function public.my_learning_access(p_course uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and private.learner_entitled((select auth.uid()),p_course);
$$;
revoke all on function public.my_learning_access(uuid) from public,anon;
grant execute on function public.my_learning_access(uuid) to authenticated;
create function public.set_learning_override(p_actor uuid,p_user uuid,p_course uuid,p_reason text,p_revoke boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from private.staff_roles where user_id=p_actor and role='admin') or length(btrim(p_reason)) not between 20 and 2000 then raise exception 'Administrator and reason required';end if;
 insert into private.learning_overrides(user_id,course_id,actor_id,reason,revoked_at) values(p_user,p_course,p_actor,btrim(p_reason),case when p_revoke then now() end)
 on conflict(user_id,course_id) do update set actor_id=p_actor,reason=btrim(p_reason),granted_at=now(),revoked_at=case when p_revoke then now() end;
 if not p_revoke then insert into public.enrolments(user_id,course_id,status) values(p_user,p_course,'active') on conflict(user_id,course_id) do update set status='active';end if;
 insert into public.audit_logs(actor_id,entity,entity_id,operation) values(p_actor,'learning_override',p_user||'/'||p_course,case when p_revoke then 'REVOKE' else 'GRANT' end);
end $$;
revoke all on function public.set_learning_override(uuid,uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.set_learning_override(uuid,uuid,uuid,text,boolean) to service_role;

-- Remove global instructor access. Financial/role administration remains separate.
drop policy courses_read on public.courses;
create policy courses_read on public.courses for select to authenticated using(status='published' or private.teaches_course(id));
drop policy courses_insert on public.courses;
create policy courses_insert on public.courses for insert to authenticated with check(private.has_role(array['admin']));
drop policy courses_update on public.courses;
create policy courses_update on public.courses for update to authenticated using(private.has_role(array['admin'])) with check(private.has_role(array['admin']));
drop policy enrolments_read on public.enrolments;
create policy enrolments_read on public.enrolments for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin','staff']) or private.teaches_course(course_id));
drop policy lessons_read on public.lessons;
create policy lessons_read on public.lessons for select to authenticated using((published and private.course_access(course_id)) or private.teaches_course(course_id));
drop policy lessons_insert on public.lessons;
create policy lessons_insert on public.lessons for insert to authenticated with check(private.teaches_course(course_id) and (private.has_role(array['admin']) or exists(select 1 from public.courses c where c.id=course_id and c.academic_status<>'approved')));
drop policy lessons_update on public.lessons;
create policy lessons_update on public.lessons for update to authenticated using(private.teaches_course(course_id) and (private.has_role(array['admin']) or exists(select 1 from public.courses c where c.id=course_id and c.academic_status<>'approved'))) with check(private.teaches_course(course_id) and (private.has_role(array['admin']) or exists(select 1 from public.courses c where c.id=course_id and c.academic_status<>'approved')));
drop policy resources_insert on public.resources;
create policy resources_insert on public.resources for insert to authenticated with check(exists(select 1 from public.lessons l where l.id=lesson_id and private.teaches_course(l.course_id)));
drop policy resources_update on public.resources;
create policy resources_update on public.resources for update to authenticated using(exists(select 1 from public.lessons l where l.id=lesson_id and private.teaches_course(l.course_id))) with check(exists(select 1 from public.lessons l where l.id=lesson_id and private.teaches_course(l.course_id)));
drop policy progress_read on public.lesson_progress;
create policy progress_read on public.lesson_progress for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.lessons l where l.id=lesson_id and private.teaches_course(l.course_id)));
drop policy profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated using(id=(select auth.uid()) or private.has_role(array['admin','staff']) or exists(select 1 from public.enrolments e where e.user_id=profiles.id and private.teaches_course(e.course_id)));
drop policy assessments_read on public.assessments;
create policy assessments_read on public.assessments for select to authenticated using(private.teaches_course(course_id) or (published and private.course_access(course_id)));
drop policy attempts_read on public.assessment_attempts;
create policy attempts_read on public.assessment_attempts for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.assessments a where a.id=assessment_id and private.teaches_course(a.course_id)));
drop policy certificates_read on public.certificates;
create policy certificates_read on public.certificates for select to authenticated using(user_id=(select auth.uid()) or private.has_role(array['admin','staff']) or private.teaches_course(course_id));
drop policy academy_staff_upload on storage.objects;
create policy academy_staff_upload on storage.objects for insert to authenticated with check(bucket_id='academy-resources' and private.has_role(array['admin']));
drop policy academy_staff_delete on storage.objects;
create policy academy_staff_delete on storage.objects for delete to authenticated using(bucket_id='academy-resources' and private.has_role(array['admin']));
drop policy academy_resource_read on storage.objects;
create policy academy_resource_read on storage.objects for select to authenticated using(bucket_id='academy-resources' and (private.has_role(array['admin']) or exists(select 1 from public.resources r join public.lessons l on l.id=r.lesson_id where r.object_path=name and ((l.published and private.course_access(l.course_id)) or private.teaches_course(l.course_id)))));

create table public.academy_modules(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id),title text not null check(length(title) between 2 and 180),objectives text not null default '' check(length(objectives)<=5000),position integer not null check(position>=0),published boolean not null default false,unique(course_id,position),unique(id,course_id));
alter table public.lessons add column module_id uuid;
alter table public.lessons add constraint lesson_same_course foreign key(module_id,course_id) references public.academy_modules(id,course_id);
create index lessons_module on public.lessons(module_id,course_id);
create table public.academic_documents(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id),module_id uuid,title text not null check(length(title) between 2 and 180),kind text not null check(kind in ('lecture','lab','question_bank','answer_key','lesson_plan','project')),audience text not null check(audience in ('student','instructor')),body text not null check(length(body) between 20 and 200000),status text not null default 'draft' check(status in ('draft','review','approved')),version integer not null default 1,updated_at timestamptz not null default now(),foreign key(module_id,course_id) references public.academy_modules(id,course_id),check(kind<>'answer_key' or audience='instructor'));
create index academic_documents_course on public.academic_documents(course_id,status,audience);
create index academic_documents_module on public.academic_documents(module_id,course_id);
create table public.academy_tasks(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id),module_id uuid,title text not null check(length(title) between 2 and 180),kind text not null check(kind in ('lab','assignment','project','short_answer')),instructions text not null check(length(instructions) between 20 and 20000),max_marks integer not null default 100 check(max_marks between 1 and 1000),pass_marks integer not null default 70 check(pass_marks>0 and pass_marks<=max_marks),required boolean not null default true,published boolean not null default false,version integer not null default 1,foreign key(module_id,course_id) references public.academy_modules(id,course_id));
create index academy_tasks_course on public.academy_tasks(course_id,published);
create index academy_tasks_module on public.academy_tasks(module_id,course_id);
create table public.academy_submissions(id uuid primary key default gen_random_uuid(),task_id uuid not null references public.academy_tasks(id),user_id uuid not null references auth.users(id),version integer not null,body text not null check(length(body) between 20 and 30000),submitted_at timestamptz not null default clock_timestamp(),score integer,feedback text,graded_by uuid references auth.users(id),graded_at timestamptz,check((score is null and graded_by is null and graded_at is null) or (score is not null and graded_by is not null and graded_at is not null)));
create index academy_submissions_user_task on public.academy_submissions(user_id,task_id,version);
create index academy_submissions_task on public.academy_submissions(task_id);
create index academy_submissions_grader on public.academy_submissions(graded_by);
create table public.learning_positions(user_id uuid not null references auth.users(id),course_id uuid not null references public.courses(id),lesson_id uuid not null references public.lessons(id),updated_at timestamptz not null default now(),primary key(user_id,course_id));
create index learning_positions_course on public.learning_positions(course_id);
create index learning_positions_lesson on public.learning_positions(lesson_id);

alter table public.academy_modules enable row level security;
alter table public.academic_documents enable row level security;
alter table public.academy_tasks enable row level security;
alter table public.academy_submissions enable row level security;
alter table public.learning_positions enable row level security;
revoke all on public.academy_modules,public.academic_documents,public.academy_tasks,public.academy_submissions,public.learning_positions from public,anon,authenticated;
grant all on public.academy_modules,public.academic_documents,public.academy_tasks,public.academy_submissions,public.learning_positions to service_role;
grant select on public.academy_modules,public.academic_documents,public.academy_tasks,public.academy_submissions,public.learning_positions to authenticated;
grant insert,update on public.academy_modules,public.academic_documents,public.academy_tasks to authenticated;
create policy modules_read on public.academy_modules for select to authenticated using(private.teaches_course(course_id) or (published and private.course_access(course_id)));
create policy modules_insert on public.academy_modules for insert to authenticated with check(private.teaches_course(course_id) and (not published or private.has_role(array['admin'])));
create policy modules_update on public.academy_modules for update to authenticated using(private.teaches_course(course_id) and (not published or private.has_role(array['admin']))) with check(private.teaches_course(course_id) and (not published or private.has_role(array['admin'])));
create policy documents_read on public.academic_documents for select to authenticated using(private.teaches_course(course_id) or (audience='student' and status='approved' and private.course_access(course_id)));
create policy documents_insert on public.academic_documents for insert to authenticated with check(private.teaches_course(course_id) and (status<>'approved' or private.has_role(array['admin'])));
create policy documents_update on public.academic_documents for update to authenticated using(private.teaches_course(course_id) and (status<>'approved' or private.has_role(array['admin']))) with check(private.teaches_course(course_id) and (status<>'approved' or private.has_role(array['admin'])));
create policy tasks_read on public.academy_tasks for select to authenticated using(private.teaches_course(course_id) or (published and private.course_access(course_id)));
create policy tasks_insert on public.academy_tasks for insert to authenticated with check(private.teaches_course(course_id) and (not published or private.has_role(array['admin'])));
create policy tasks_update on public.academy_tasks for update to authenticated using(private.teaches_course(course_id) and (not published or private.has_role(array['admin']))) with check(private.teaches_course(course_id) and (not published or private.has_role(array['admin'])));
create policy submissions_read on public.academy_submissions for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.academy_tasks t where t.id=task_id and private.teaches_course(t.course_id)));
create policy positions_read on public.learning_positions for select to authenticated using(user_id=(select auth.uid()) or private.teaches_course(course_id));

create function private.document_version() returns trigger language plpgsql security invoker set search_path='' as $$begin new.version=old.version+1;new.updated_at=now();return new;end $$;
create trigger academic_document_version before update on public.academic_documents for each row execute function private.document_version();
create function private.task_version() returns trigger language plpgsql security invoker set search_path='' as $$begin new.version=old.version+1;return new;end $$;
create trigger academy_task_version before update on public.academy_tasks for each row execute function private.task_version();
revoke all on function private.document_version(),private.task_version() from public,anon,authenticated;

create function public.submit_academy_task(p_user uuid,p_task uuid,p_body text) returns uuid language plpgsql security invoker set search_path='' as $$
declare t public.academy_tasks; sid uuid; n integer;
begin
 select * into strict t from public.academy_tasks where id=p_task and published for update;
 if not private.learner_entitled(p_user,t.course_id) then raise exception 'Verified course access required';end if;
 select count(*) into n from public.academy_submissions where user_id=p_user and task_id=t.id and version=t.version;
 if n>=5 then raise exception 'Submission limit reached; contact your instructor';end if;
 insert into public.academy_submissions(task_id,user_id,version,body) values(t.id,p_user,t.version,btrim(p_body)) returning id into sid;return sid;
end $$;
create function public.grade_academy_task(p_actor uuid,p_submission uuid,p_score integer,p_feedback text) returns void language plpgsql security invoker set search_path='' as $$
declare s public.academy_submissions;t public.academy_tasks;
begin
 select * into strict s from public.academy_submissions where id=p_submission for update;
 select * into strict t from public.academy_tasks where id=s.task_id;
 if p_actor=s.user_id or not exists(select 1 from private.staff_roles r where r.user_id=p_actor and (r.role='admin' or (r.role='instructor' and exists(select 1 from public.courses c where c.id=t.course_id and c.instructor_id=p_actor)))) then raise exception 'Assigned instructor required';end if;
 if s.version<>t.version or p_score is null or p_score not between 0 and t.max_marks or length(btrim(coalesce(p_feedback,''))) not between 10 and 5000 then raise exception 'Invalid grading details';end if;
 update public.academy_submissions set score=p_score,feedback=btrim(p_feedback),graded_by=p_actor,graded_at=now() where id=s.id;
 insert into public.audit_logs(actor_id,entity,entity_id,operation) values(p_actor,'academy_submission',s.id::text,'GRADE');
end $$;
create function public.save_learning_position(p_user uuid,p_course uuid,p_lesson uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not private.learner_entitled(p_user,p_course) or not exists(select 1 from public.lessons where id=p_lesson and course_id=p_course and published) then raise exception 'Lesson unavailable';end if;
 insert into public.learning_positions values(p_user,p_course,p_lesson,now()) on conflict(user_id,course_id) do update set lesson_id=p_lesson,updated_at=now();
end $$;
revoke all on function public.submit_academy_task(uuid,uuid,text),public.grade_academy_task(uuid,uuid,integer,text),public.save_learning_position(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.submit_academy_task(uuid,uuid,text),public.grade_academy_task(uuid,uuid,integer,text),public.save_learning_position(uuid,uuid,uuid) to service_role;

-- Wrap legacy grading and certificates so forged active enrolments cannot bypass payment.
alter function public.grade_assessment(uuid,uuid,integer,jsonb) rename to grade_assessment_legacy;
create function public.grade_assessment(p_user uuid,p_assessment uuid,p_version integer,p_answers jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.assessments a where a.id=p_assessment and private.learner_entitled(p_user,a.course_id)) then raise exception 'Verified course access required';end if;
 return private.grade_assessment_legacy(p_user,p_assessment,p_version,p_answers);
end $$;
alter function public.issue_certificate(uuid,uuid) rename to issue_certificate_legacy;
create function public.issue_certificate(p_user uuid,p_course uuid) returns text language plpgsql security invoker set search_path='' as $$
begin
 if not private.learner_entitled(p_user,p_course) then raise exception 'Verified course access required';end if;
 if exists(select 1 from public.courses where id=p_course and academy_code is not null) then
  if not exists(select 1 from public.academy_modules where course_id=p_course and published) or exists(select 1 from public.academy_modules m where m.course_id=p_course and (not m.published or not exists(select 1 from public.lessons l where l.module_id=m.id and l.published))) then raise exception 'Course modules are not ready';end if;
  if not exists(select 1 from public.academy_tasks where course_id=p_course and kind='project' and required and published) then raise exception 'Final project is not ready';end if;
  if exists(select 1 from public.academy_tasks t where t.course_id=p_course and t.required and (not t.published or not exists(select 1 from public.academy_submissions s where s.task_id=t.id and s.user_id=p_user and s.version=t.version and s.score>=t.pass_marks))) then raise exception 'Complete the required practical work';end if;
 end if;
 return private.issue_certificate_legacy(p_user,p_course);
end $$;
revoke all on function public.grade_assessment(uuid,uuid,integer,jsonb),public.issue_certificate(uuid,uuid),public.grade_assessment_legacy(uuid,uuid,integer,jsonb),public.issue_certificate_legacy(uuid,uuid) from public,anon,authenticated;
grant execute on function public.grade_assessment(uuid,uuid,integer,jsonb),public.issue_certificate(uuid,uuid) to service_role;
-- Internal legacy routines must not remain an alternate service API.
revoke execute on function public.grade_assessment_legacy(uuid,uuid,integer,jsonb),public.issue_certificate_legacy(uuid,uuid) from service_role;
-- The wrappers run as service_role, so give them direct implementations via restricted owner execution.
-- Use private implementations, reachable by service wrappers only, not exposed PostgREST RPCs.
alter function public.grade_assessment_legacy(uuid,uuid,integer,jsonb) set schema private;
alter function public.issue_certificate_legacy(uuid,uuid) set schema private;
grant execute on function private.grade_assessment_legacy(uuid,uuid,integer,jsonb),private.issue_certificate_legacy(uuid,uuid) to service_role;
alter table public.certificates add column expires_at timestamptz;
insert into public.courses(slug,title,description,category,price_minor,currency,academy_code,objectives,prerequisites) values
('cloud-computing','Cloud Computing','Practical cloud foundations, networking, identity, deployment and operations. Academic content is being developed and reviewed.','Cloud Computing',1500000,'NGN','cloud','Explain cloud models; design secure networks; deploy and monitor a small workload; demonstrate recovery and cleanup.','Basic computer use; introductory networking helpful.'),
('digital-marketing','Digital Marketing','Brand strategy, content, channels, search, advertising and measurement. Academic content is being developed and reviewed.','Digital Marketing',1500000,'NGN','marketing','Plan a measurable campaign; create accessible content; interpret analytics; evaluate conversion outcomes.','Basic computer use and written communication.'),
('computer-networking-huawei-cisco','Computer Networking — Huawei and Cisco','Practical networking concepts, configuration and troubleshooting. Independent training; vendor certification is separate. Academic content is being developed and reviewed.','Networking',1500000,'NGN','networking','Subnet IPv4 networks; configure VLANs and routing; troubleshoot connectivity; document an enterprise lab.','Basic computer use and a legitimate simulator or training lab.'),
('project-management','Project Management','Initiation, planning, delivery, Agile and project controls. Academic content is being developed and reviewed.','Project Management',1500000,'NGN','project-management','Create a charter, work breakdown, schedule, budget and risk register; run and close a project simulation.','Basic spreadsheet and communication skills.'),
('artificial-intelligence-automation','Artificial Intelligence and Automation','Responsible AI, prompting, APIs and practical workflow automation. Academic content is being developed and reviewed.','AI & Automation',1500000,'NGN','ai-automation','Evaluate model output; design prompts; integrate APIs; build and test an automation with human review.','Basic computer use; introductory programming helpful.');
commit;
