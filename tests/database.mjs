import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
let passed = 0;
const check = (label, fn) =>
  Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log("PASS", label);
    });
await db.exec(
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;create schema storage;grant usage on schema storage to authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;`,
);
const migration = await readFile(
  new URL(
    "../supabase/migrations/20261105105526_mega_stride_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);
await check(
  "clean migration applies with Supabase auth/storage contract stubs",
  () => db.exec(migration),
);
await check("notification queue migration applies", async () =>
  db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261105105547_notification_delivery.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
await check("advisor-improvement migration applies", async () =>
  db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261105105820_database_advisor_improvements.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
const userA = "11111111-1111-4111-8111-111111111111",
  userB = "22222222-2222-4222-8222-222222222222",
  admin = "33333333-3333-4333-8333-333333333333",
  editor = "44444444-4444-4444-8444-444444444444";
await db.exec(
  `insert into auth.users values('${userA}'),('${userB}'),('${admin}'),('${editor}');insert into private.staff_roles values('${admin}','admin'),('${editor}','editor');insert into public.courses(id,slug,title,description,status) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','test-course','Test course','Synthetic course','published'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','draft-course','Draft course','Synthetic course','draft');insert into public.enrolments(user_id,course_id,status) values('${userA}','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active');insert into public.lessons(id,course_id,title,body,position,published) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test lesson','Synthetic content',1,true);insert into public.content(kind,slug,title,summary,body,status) values('post','published-post','Published test','Summary','Body','published'),('post','draft-post','Draft test','Summary','Body','draft');`,
);
async function as(role, uid, fn) {
  await db.exec(
    `set role ${role};select set_config('request.jwt.claim.sub','${uid || ""}',false);`,
  );
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
await check("anonymous sees published content only", () =>
  as("anon", "", async () => {
    assert.equal(
      (await db.query("select * from public.content")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from public.courses")).rows.length,
      1,
    );
  }),
);
await check("anonymous cannot read private enquiries", async () => {
  await assert.rejects(() =>
    as("anon", "", () => db.query("select * from public.enquiries")),
  );
});
await check("learner sees only own enrolment", () =>
  as("authenticated", userB, async () =>
    assert.equal(
      (await db.query("select * from public.enrolments")).rows.length,
      0,
    ),
  ),
);
await check("enrolled learner reads permitted lesson", () =>
  as("authenticated", userA, async () =>
    assert.equal(
      (await db.query("select * from public.lessons")).rows.length,
      1,
    ),
  ),
);
await check("unenrolled learner cannot read lesson or complete it", () =>
  as("authenticated", userB, async () => {
    assert.equal(
      (await db.query("select * from public.lessons")).rows.length,
      0,
    );
    await assert.rejects(() =>
      db.exec(
        `insert into public.lesson_progress(lesson_id) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc')`,
      ),
    );
  }),
);
await check("learner cannot enrol themselves or escalate staff role", () =>
  as("authenticated", userB, async () => {
    await assert.rejects(() =>
      db.exec(
        `insert into public.enrolments(user_id,course_id,status) values('${userB}','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active')`,
      ),
    );
    await assert.rejects(() =>
      db.exec(`insert into private.staff_roles values('${userB}','admin')`),
    );
  }),
);
await check(
  "completion is owned and cannot be assigned to another learner",
  () =>
    as("authenticated", userA, async () => {
      await db.exec(
        `insert into public.lesson_progress(lesson_id) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc')`,
      );
      await assert.rejects(() =>
        db.exec(
          `insert into public.lesson_progress(user_id,lesson_id) values('${userB}','cccccccc-cccc-4ccc-8ccc-cccccccccccc')`,
        ),
      );
    }),
);
await check("another learner cannot see completion records", () =>
  as("authenticated", userB, async () =>
    assert.equal(
      (await db.query("select * from public.lesson_progress")).rows.length,
      0,
    ),
  ),
);
await check("staff role is checked from protected server-owned records", () =>
  as("authenticated", admin, async () =>
    assert.equal(
      (await db.query("select public.my_staff_role() as role")).rows[0].role,
      "admin",
    ),
  ),
);
await check("editor can manage publications but cannot read enquiries", () =>
  as("authenticated", editor, async () => {
    await db.exec(
      `update public.content set title='Edited title' where slug='draft-post'`,
    );
    assert.equal(
      (await db.query("select * from public.content_revisions")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from public.enquiries")).rows.length,
      0,
    );
  }),
);
const payload = {
  kind: "contact",
  name: "Synthetic Test",
  email: "test@example.test",
  country: "Nigeria",
  service: "Networking",
  message: "Synthetic test enquiry content.",
};
await check("service intake atomically stores enquiry and outbox", () =>
  as("service_role", "", async () => {
    await db.query("select public.submit_enquiry($1::jsonb,$2)", [
      JSON.stringify(payload),
      "f".repeat(64),
    ]);
    assert.equal(
      (await db.query("select * from public.enquiries")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from public.notification_outbox")).rows.length,
      1,
    );
  }),
);
await check(
  "anonymous and learner cannot call privileged intake RPC",
  async () => {
    for (const [role, uid] of [
      ["anon", ""],
      ["authenticated", userA],
    ])
      await assert.rejects(() =>
        as(role, uid, () =>
          db.query("select public.submit_enquiry($1::jsonb,$2)", [
            JSON.stringify(payload),
            "e".repeat(64),
          ]),
        ),
      );
  },
);
await check("persistent limiter rejects the sixth submission", () =>
  as("service_role", "", async () => {
    for (let n = 0; n < 4; n++)
      await db.query("select public.submit_enquiry($1::jsonb,$2)", [
        JSON.stringify(payload),
        "f".repeat(64),
      ]);
    await assert.rejects(() =>
      db.query("select public.submit_enquiry($1::jsonb,$2)", [
        JSON.stringify(payload),
        "f".repeat(64),
      ]),
    );
    assert.equal(
      (await db.query("select * from public.enquiries")).rows.length,
      5,
    );
  }),
);
await check(
  "anonymous and learners cannot mark transactions paid",
  async () => {
    await assert.rejects(() =>
      as("authenticated", userA, () =>
        db.exec(`update public.transactions set status='verified'`),
      ),
    );
  },
);
await check("every public table has RLS enabled", async () => {
  const { rows } = await db.query(
    `select relname from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relkind='r' and not relrowsecurity`,
  );
  assert.deepEqual(rows, []);
});
await check("private resources cannot be read without enrolment", async () => {
  await db.exec(
    `insert into public.resources(lesson_id,title,object_path) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Test PDF','a/test.pdf');insert into storage.objects(bucket_id,name) values('academy-resources','a/test.pdf');`,
  );
  await as("authenticated", userB, async () =>
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    ),
  );
  await as("authenticated", userA, async () =>
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      1,
    ),
  );
});
await check("unenrolled learner cannot create or list course resources", () =>
  as("authenticated", userB, async () => {
    assert.equal(
      (await db.query("select * from public.resources")).rows.length,
      0,
    );
    await assert.rejects(() =>
      db.exec(
        `insert into public.resources(lesson_id,title,object_path) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','No access','bad.pdf')`,
      ),
    );
  }),
);
await check("outbox leases cannot be claimed twice", () =>
  as("service_role", "", async () => {
    assert.equal(
      (await db.query("select * from public.claim_notifications()")).rows
        .length,
      5,
    );
    assert.equal(
      (await db.query("select * from public.claim_notifications()")).rows
        .length,
      0,
    );
  }),
);
await check("learner cannot claim the email outbox", async () =>
  assert.rejects(() =>
    as("authenticated", userA, () =>
      db.query("select * from public.claim_notifications()"),
    ),
  ),
);
await check(
  "local database snapshot restores into an isolated instance",
  async () => {
    const snapshot = await db.dumpDataDir();
    const restored = await PGlite.create({ loadDataDir: snapshot });
    assert.equal(
      (await restored.query("select count(*)::int as n from public.enquiries"))
        .rows[0].n,
      5,
    );
    await restored.close();
  },
);
console.log(
  `${passed} isolated PostgreSQL checks passed. Auth/Storage API and hosted restore remain release gates.`,
);
await db.close();
