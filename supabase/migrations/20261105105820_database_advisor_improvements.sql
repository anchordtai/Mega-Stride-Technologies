begin;
create index content_creator on public.content(created_by);
create index content_revisions_actor on public.content_revisions(actor);
create index content_revisions_parent on public.content_revisions(content_id);
create index enquiry_notes_author on public.enquiry_notes(author_id);

-- Use one SELECT policy per role while retaining the same ownership and staff permissions.
drop policy content_public on public.content;
drop policy content_edit on public.content;
create policy content_public on public.content for select to anon using(status='published');
create policy content_read on public.content for select to authenticated using(status='published' or private.has_role(array['admin','editor']));
create policy content_insert on public.content for insert to authenticated with check(private.has_role(array['admin','editor']));
create policy content_update on public.content for update to authenticated using(private.has_role(array['admin','editor'])) with check(private.has_role(array['admin','editor']));

drop policy courses_public on public.courses;
drop policy courses_manage on public.courses;
create policy courses_public on public.courses for select to anon using(status='published');
create policy courses_read on public.courses for select to authenticated using(status='published' or private.has_role(array['admin','instructor']));
create policy courses_insert on public.courses for insert to authenticated with check(private.has_role(array['admin','instructor']));
create policy courses_update on public.courses for update to authenticated using(private.has_role(array['admin','instructor'])) with check(private.has_role(array['admin','instructor']));

drop policy enrolments_manage on public.enrolments;
create policy enrolments_insert on public.enrolments for insert to authenticated with check(private.has_role(array['admin','staff']));
create policy enrolments_update on public.enrolments for update to authenticated using(private.has_role(array['admin','staff'])) with check(private.has_role(array['admin','staff']));

drop policy lessons_read on public.lessons;
drop policy lessons_manage on public.lessons;
create policy lessons_read on public.lessons for select to authenticated using((published and private.course_access(course_id)) or private.has_role(array['admin','instructor']));
create policy lessons_insert on public.lessons for insert to authenticated with check(private.has_role(array['admin','instructor']));
create policy lessons_update on public.lessons for update to authenticated using(private.has_role(array['admin','instructor'])) with check(private.has_role(array['admin','instructor']));

drop policy resources_manage on public.resources;
create policy resources_insert on public.resources for insert to authenticated with check(private.has_role(array['admin','instructor']));
create policy resources_update on public.resources for update to authenticated using(private.has_role(array['admin','instructor'])) with check(private.has_role(array['admin','instructor']));
commit;
