import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
export async function runRegistrationChecks({db,as,check}) {
  await db.exec(await readFile(new URL('../supabase/migrations/20261113135816_academy_course_registration.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/20261114105558_academy_registration_verified_identity.sql',import.meta.url),'utf8'));
  const register=(user,course)=>as('service_role',null,()=>db.query('select register_academy_course($1,$2) status',[user,course]));
  const student='a1111111-1111-4111-8111-111111111111',unverified='a2222222-2222-4222-8222-222222222222';
  const paid='b1111111-1111-4111-8111-111111111111',free='b2222222-2222-4222-8222-222222222222',draft='b3333333-3333-4333-8333-333333333333';
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'registration@example.invalid',now()),($2,'unverified@example.invalid',null)",[student,unverified]);
  await db.query("insert into public.courses(id,slug,title,description,status,price_minor,currency) values($1,'paid-registration-test','Paid registration test','Isolated test','published',1500000,'NGN'),($2,'free-registration-test','Free registration test','Isolated test','published',0,'NGN'),($3,'draft-registration-test','Draft registration test','Isolated test','draft',100,'NGN')",[paid,free,draft]);
  await check('registration works without raw Auth grants and its private predicate is service-only',async()=>{
    assert.equal((await db.query("select has_table_privilege('service_role','auth.users','SELECT') ok")).rows[0].ok,false);
    for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'private.account_is_verified(uuid)','EXECUTE') ok",[role])).rows[0].ok,false);
    assert.equal((await as('service_role',null,()=>db.query('select private.account_is_verified($1) ok',[student]))).rows[0].ok,true);
    assert.equal((await as('service_role',null,()=>db.query('select private.account_is_verified($1) ok',[unverified]))).rows[0].ok,false);
  });
  await check('registration is service-only and rejects unverified users and unpublished courses',async()=>{
    for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'public.register_academy_course(uuid,uuid)','EXECUTE') ok",[role])).rows[0].ok,false);
    await assert.rejects(()=>register(unverified,paid));
    await assert.rejects(()=>register(student,draft));
  });
  await check('paid registration is idempotent, pending, and never creates a transaction or course access',async()=>{
    for(let n=0;n<2;n++)assert.equal((await register(student,paid)).rows[0].status,'pending');
    assert.equal((await db.query('select count(*)::int n from enrolments where user_id=$1 and course_id=$2',[student,paid])).rows[0].n,1);
    assert.equal((await db.query('select count(*)::int n from transactions where user_id=$1',[student])).rows[0].n,0);
    assert.equal((await as('authenticated',student,()=>db.query('select my_learning_access($1) ok',[paid]))).rows[0].ok,false);
  });
  await check('free registration opens access but cancelled registrations cannot be reactivated',async()=>{
    assert.equal((await register(student,free)).rows[0].status,'active');
    assert.equal((await as('authenticated',student,()=>db.query('select my_learning_access($1) ok',[free]))).rows[0].ok,true);
    await db.query("update enrolments set status='cancelled' where user_id=$1 and course_id=$2",[student,free]);
    await assert.rejects(()=>register(student,free));
    assert.equal((await db.query('select status from enrolments where user_id=$1 and course_id=$2',[student,free])).rows[0].status,'cancelled');
  });
  await check('test payment leaves registration pending; matched live settlement unlocks only that paid course',async()=>{
    for(const mode of ['test','live']) {
      const t=(await db.query("select begin_checkout($1,$2,'registration@example.invalid',$3) t",[student,paid,mode])).rows[0].t;
      await db.query("select settle_payment($1,$2,'NGN',$3,$4,'registration@example.invalid')",[t.reference,t.amount_minor,`registration-${mode}`,mode]);
      assert.equal((await as('authenticated',student,()=>db.query('select my_learning_access($1) ok',[paid]))).rows[0].ok,mode==='live');
      assert.equal((await db.query('select status from enrolments where user_id=$1 and course_id=$2',[student,paid])).rows[0].status,mode==='live'?'active':'pending');
    }
    assert.equal((await as('authenticated',unverified,()=>db.query('select my_learning_access($1) ok',[paid]))).rows[0].ok,false);
    assert.equal((await register(student,paid)).rows[0].status,'active');
  });
}
