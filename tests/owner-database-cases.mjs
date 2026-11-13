import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
export async function runOwnerChecks({db,as,check,admin}){
 const owner='77777777-7777-4777-8777-777777777777',learner='88888888-8888-4888-8888-888888888888',pending='99999999-9999-4999-8999-999999999999';
 await db.exec("alter table auth.users add column created_at timestamptz not null default now();alter table auth.users add column email_confirmed_at timestamptz;alter table auth.users add column is_anonymous boolean not null default false;alter table auth.users add column raw_user_meta_data jsonb not null default '{}'::jsonb;");
 await db.query("insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'owner@example.invalid',null,'{}'),($2,'student@example.invalid',now(),'{\"role\":\"admin\"}'),($3,'pending@example.invalid',null,'{}')",[owner,learner,pending]);
 await check('owner-management migration applies without granting an unverified owner',async()=>{
  await db.exec(await readFile(new URL('../supabase/migrations/20261113132449_academy_owner_and_member_management.sql',import.meta.url),'utf8'));
  await db.exec("insert into private.academy_owners(email) values('owner@example.invalid')");
  await db.exec(await readFile(new URL('../supabase/migrations/20261113133502_owner_only_signup_setup.sql',import.meta.url),'utf8'));
  assert.equal((await db.query('select claim_academy_owner($1) ok',[owner])).rows[0].ok,false);
  assert.equal((await db.query('select count(*)::int n from private.staff_roles where user_id=$1',[owner])).rows[0].n,0);
 });
 await check('owner bootstrap remains disabled until Auth confirmation settings are checked',async()=>{
  await db.query('update auth.users set email_confirmed_at=now() where id=$1',[owner]);
  assert.equal((await db.query('select claim_academy_owner($1) ok',[owner])).rows[0].ok,false);
  await db.query('update auth.users set email_confirmed_at=null where id=$1',[owner]);
  await db.exec('update private.academy_owners set bootstrap_enabled=true');
  assert.equal((await db.query('select claim_academy_owner($1) ok',[owner])).rows[0].ok,false);
 });
 await check('signup metadata cannot grant staff or super-admin roles',async()=>{
  assert.equal((await db.query('select claim_academy_owner($1) ok',[learner])).rows[0].ok,false);
  assert.equal((await db.query('select private.academy_super_admin($1) ok',[learner])).rows[0].ok,false);
  assert.equal((await db.query('select count(*)::int n from private.staff_roles where user_id=$1',[learner])).rows[0].n,0);
 });
 await check('owner-only signup allows exactly the configured address while general signup stays off',async()=>{
  assert.equal((await db.query("select owner_signup_available('owner@example.invalid') ok")).rows[0].ok,true);
  assert.equal((await db.query("select owner_signup_available('student@example.invalid') ok")).rows[0].ok,false);
  assert.equal((await db.query("select has_function_privilege('anon','public.owner_signup_available(text)','EXECUTE') ok")).rows[0].ok,false);
  assert.equal((await db.query("select has_function_privilege('authenticated','public.owner_signup_available(text)','EXECUTE') ok")).rows[0].ok,false);
 });
 await check('verified explicitly designated owner claims idempotent super-admin membership',async()=>{
  await db.query('update auth.users set email_confirmed_at=now() where id=$1',[owner]);
  assert.equal((await db.query('select claim_academy_owner($1) ok',[owner])).rows[0].ok,true);
  assert.equal((await db.query('select claim_academy_owner($1) ok',[owner])).rows[0].ok,true);
  assert.equal((await db.query("select count(*)::int n from private.academy_admin_changes where action='owner_claim'")).rows[0].n,1);
  assert.equal((await db.query('select role from private.staff_roles where user_id=$1',[owner])).rows[0].role,'admin');
  assert.equal((await db.query("select owner_signup_available('owner@example.invalid') ok")).rows[0].ok,false);
 });
 await check('anonymous and ordinary accounts cannot call account administration RPCs',async()=>{
  for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'public.change_academy_role(uuid,uuid,text,text)','EXECUTE') ok",[role])).rows[0].ok,false);
  await assert.rejects(()=>as('authenticated',learner,()=>db.query("select academy_members($1,'','all',1)",[owner])));
  await assert.rejects(()=>db.query("select academy_members($1,'','all',1)",[learner]));
  await assert.rejects(()=>db.query("select academy_members($1,'','all',1)",[admin]));
 });
 await check('current-session owner flag is self-only and cannot be forged by another user',async()=>{
  await as('authenticated',owner,async()=>assert.equal((await db.query('select my_academy_owner_status() ok')).rows[0].ok,true));
  await as('authenticated',learner,async()=>assert.equal((await db.query('select my_academy_owner_status() ok')).rows[0].ok,false));
 });
 await check('instructor requests are pending-only and private to the requester or administrator',async()=>{
  await as('authenticated',learner,()=>db.query('insert into instructor_requests(user_id,notes) values($1,$2)',[learner,'Synthetic instructor application']));
  await assert.rejects(()=>as('authenticated',pending,()=>db.query("insert into instructor_requests(user_id,status) values($1,'approved')",[pending])));
  await as('authenticated',pending,async()=>assert.equal((await db.query('select count(*)::int n from instructor_requests')).rows[0].n,0));
 });
 await check('only the owner can promote verified accounts and the owner cannot be demoted',async()=>{
  const reason='Synthetic approved instructor review for isolated role tests.';
  await assert.rejects(()=>db.query("select change_academy_role($1,$2,'admin',$3)",[learner,learner,reason]));
  await assert.rejects(()=>db.query("select change_academy_role($1,$2,'instructor',$3)",[owner,pending,reason]));
  await assert.rejects(()=>db.query("select change_academy_role($1,$2,'student',$3)",[owner,owner,reason]));
  await db.query("select change_academy_role($1,$2,'instructor',$3)",[owner,learner,reason]);
  assert.equal((await db.query('select role from private.staff_roles where user_id=$1',[learner])).rows[0].role,'instructor');
  assert.equal((await db.query('select status from instructor_requests where user_id=$1',[learner])).rows[0].status,'approved');
 });
 const course=(await db.query("select id from courses where academy_code='cloud'")).rows[0].id;
 await check('instructor assignment validates role and demotion removes teaching assignments',async()=>{
  const reason='Synthetic course assignment and demotion safety verification.';
  await assert.rejects(()=>db.query('select assign_academy_instructor($1,$2,$3,$4)',[owner,course,pending,reason]));
  await db.query('select assign_academy_instructor($1,$2,$3,$4)',[owner,course,learner,reason]);
  assert.equal((await db.query('select instructor_id from courses where id=$1',[course])).rows[0].instructor_id,learner);
  await db.query("select change_academy_role($1,$2,'student',$3)",[owner,learner,reason]);
  assert.equal((await db.query('select instructor_id from courses where id=$1',[course])).rows[0].instructor_id,null);
 });
 await check('enrolment management never fabricates payment or bypasses paid access',async()=>{
  const before=(await db.query('select count(*)::int n from transactions')).rows[0].n;
  await db.query("select manage_academy_enrolment($1,$2,$3,'active',$4)",[owner,learner,course,'Synthetic enrolment status change without a payment.']);
  assert.equal((await db.query('select private.learner_entitled($1,$2) ok',[learner,course])).rows[0].ok,false);
  assert.equal((await db.query('select count(*)::int n from transactions')).rows[0].n,before);
 });
 await check('owner testing exceptions grant and revoke own access without a transaction',async()=>{
  const before=(await db.query('select count(*)::int n from transactions')).rows[0].n;
  await assert.rejects(()=>db.query('select set_owner_course_test($1,true)',[learner]));
  await db.query('select set_owner_course_test($1,true)',[owner]);
  assert.equal((await db.query('select private.learner_entitled($1,$2) ok',[owner,course])).rows[0].ok,true);
  await db.query('select set_owner_course_test($1,false)',[owner]);
  assert.equal((await db.query('select private.learner_entitled($1,$2) ok',[owner,course])).rows[0].ok,false);
  assert.equal((await db.query('select count(*)::int n from transactions')).rows[0].n,before);
 });
 await check('super-admin member search and pagination return bounded structured data',async()=>{
  const result=(await db.query("select academy_members($1,'student@example.invalid','student',1000) d",[owner])).rows[0].d;
  assert.equal(result.members.length,1);assert.equal(result.members[0].id,learner);assert.equal(result.page,1);
  assert.ok(result.changes.length<=20);assert.ok(result.instructors.length<=200);
 });
}
