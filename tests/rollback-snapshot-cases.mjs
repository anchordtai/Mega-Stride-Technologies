import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
export async function runRollbackSnapshotChecks({db,as,check}) {
 await check('Protected same-project snapshot verifies every retained application row and temporary restore',async()=>{
  await db.exec('begin');
  try {await db.exec(await readFile(new URL('../supabase/migrations/20261116115537_business_desk_private_rollback_snapshot.sql',import.meta.url),'utf8'));await db.exec('commit');}
  catch(e){await db.exec('rollback');throw e;}
  const count=(await db.query("select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r'")).rows[0].n;
  assert.equal((await db.query('select count(*)::int n from msbd_rollback_20261116.manifest')).rows[0].n,count);
  assert.ok((await db.query("select count(*)::int n from msbd_rollback_20261116.catalog where kind='function'")).rows[0].n>0);
 });
 await check('Rollback copies cannot be read or changed by public, student or application service roles',async()=>{
  for(const role of ['anon','authenticated','service_role']) {
   assert.equal((await db.query("select has_schema_privilege($1,'msbd_rollback_20261116','USAGE') ok",[role])).rows[0].ok,false);
   assert.equal((await db.query("select has_table_privilege($1,'msbd_rollback_20261116.public__courses','SELECT') ok",[role])).rows[0].ok,false);
   await assert.rejects(()=>as(role,null,()=>db.query('select * from msbd_rollback_20261116.manifest')));
  }
  assert.equal((await db.query("select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='msbd_rollback_20261116' and c.relkind='r' and not c.relrowsecurity")).rows[0].n,0);
 });
 await check('Rollback retains independent rows when application data subsequently changes',async()=>{
  const c=(await db.query('select id,title from public.courses limit 1')).rows[0];
  await db.exec('begin');
  try {
   await db.query("update public.courses set title='Changed after isolated snapshot' where id=$1",[c.id]);
   assert.equal((await db.query('select title from msbd_rollback_20261116.public__courses where id=$1',[c.id])).rows[0].title,c.title);
  } finally {await db.exec('rollback');}
 });
}
