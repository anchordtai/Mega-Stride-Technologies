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
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;create schema storage;grant usage on schema storage to authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;`,
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
await check("production enquiry protection migration applies", async () =>
  db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261105114941_production_enquiry_protection.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
await check("Academy commerce delivery migration applies", async () =>
  db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261105142057_academy_commerce_delivery.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
await check("explicit hosted grants migration applies",async()=>db.exec(await readFile(new URL("../supabase/migrations/20261105142305_academy_explicit_grants.sql",import.meta.url),"utf8")));
const userA = "11111111-1111-4111-8111-111111111111",
  userB = "22222222-2222-4222-8222-222222222222",
  admin = "33333333-3333-4333-8333-333333333333",
  editor = "44444444-4444-4444-8444-444444444444";
await db.exec(
  `insert into auth.users(id) values('${userA}'),('${userB}'),('${admin}'),('${editor}');insert into private.staff_roles values('${admin}','admin'),('${editor}','editor');insert into public.courses(id,slug,title,description,status) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','test-course','Test course','Synthetic course','published'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','draft-course','Draft course','Synthetic course','draft');insert into public.enrolments(user_id,course_id,status) values('${userA}','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active');insert into public.lessons(id,course_id,title,body,position,published) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test lesson','Synthetic content',1,true);insert into public.content(kind,slug,title,summary,body,status) values('post','published-post','Published test','Summary','Body','published'),('post','draft-post','Draft test','Summary','Body','draft');`,
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
await check("signed submission retries are idempotent", () =>
  as("service_role", "", async () => {
    const request = {
      ...payload,
      email: "retry@example.test",
      submission_key: "a".repeat(48),
    };
    const first = await db.query(
      "select public.submit_enquiry($1::jsonb,$2) as ref",
      [JSON.stringify(request), "a".repeat(64)],
    );
    const retry = await db.query(
      "select public.submit_enquiry($1::jsonb,$2) as ref",
      [JSON.stringify(request), "a".repeat(64)],
    );
    assert.equal(first.rows[0].ref, retry.rows[0].ref);
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from public.enquiries where email='retry@example.test'",
        )
      ).rows[0].n,
      1,
    );
  }),
);

let assessmentId;
await check("assessment stores answer keys only in private schema", () =>
  as("service_role", "", async () => {
    const r = await db.query(
      "select public.save_assessment($1,'Unit assessment',$2::jsonb,$3::jsonb,70,2,true) as id",
      [
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        JSON.stringify([
          { prompt: "Choose the correct answer", options: ["No", "Yes"] },
        ]),
        "[1]",
      ],
    );
    assessmentId = r.rows[0].id;
  }),
);
await check(
  "unenrolled learners cannot see assessment questions or private answers",
  () =>
    as("authenticated", userB, async () => {
      assert.equal(
        (await db.query("select * from public.assessments")).rows.length,
        0,
      );
      await assert.rejects(() =>
        db.query("select * from private.assessment_keys"),
      );
    }),
);
await check(
  "learners cannot grade their own answers or fabricate results",
  () =>
    as("authenticated", userA, async () => {
      assert.equal(
        (await db.query("select * from public.assessments")).rows.length,
        1,
      );
      await assert.rejects(() =>
        db.query("select public.grade_assessment($1,$2,1,'[1]')", [
          userA,
          assessmentId,
        ]),
      );
      await assert.rejects(() =>
        db.query(
          "insert into public.assessment_attempts(assessment_id,user_id,version,attempt_no,score,passed) values($1,$2,1,1,100,true)",
          [assessmentId, userA],
        ),
      );
    }),
);
await check("assessment rejects unenrolled and stale-version attempts", () =>
  as("service_role", "", async () => {
    await assert.rejects(() =>
      db.query("select public.grade_assessment($1,$2,1,'[1]')", [
        userB,
        assessmentId,
      ]),
    );
    await assert.rejects(() =>
      db.query("select public.grade_assessment($1,$2,2,'[1]')", [
        userA,
        assessmentId,
      ]),
    );
  }),
);
await check(
  "server grading records correct scores and enforces attempt limit",
  () =>
    as("service_role", "", async () => {
      const fail = await db.query(
        "select public.grade_assessment($1,$2,1,'[0]') as result",
        [userA, assessmentId],
      );
      assert.equal(fail.rows[0].result.score, 0);
      const pass = await db.query(
        "select public.grade_assessment($1,$2,1,'[1]') as result",
        [userA, assessmentId],
      );
      assert.equal(pass.rows[0].result.score, 100);
      assert.equal(pass.rows[0].result.passed, true);
      await assert.rejects(() =>
        db.query("select public.grade_assessment($1,$2,1,'[1]')", [
          userA,
          assessmentId,
        ]),
      );
    }),
);
let certificateCode;
await check(
  "certificates require profile, lessons and passed assessment and issue idempotently",
  () =>
    as("service_role", "", async () => {
      await db.exec(
        `insert into public.profiles(id,display_name) values('${userA}','Synthetic Learner');insert into public.lessons(id,course_id,title,body,position,published) values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Second lesson','Synthetic',2,true);`,
      );
      await assert.rejects(() =>
        db.query("select public.issue_certificate($1,$2)", [
          userA,
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        ]),
      );
      await db.exec(
        `insert into public.lesson_progress(user_id,lesson_id) values('${userA}','cccccccc-cccc-4ccc-8ccc-cccccccccccc'),('${userA}','dddddddd-dddd-4ddd-8ddd-dddddddddddd') on conflict do nothing;`,
      );
      const c = await db.query(
        "select public.issue_certificate($1,$2) as code",
        [userA, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      );
      certificateCode = c.rows[0].code;
      assert.match(certificateCode, /^[a-f0-9]{32}$/);
      const again = await db.query(
        "select public.issue_certificate($1,$2) as code",
        [userA, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      );
      assert.equal(again.rows[0].code, certificateCode);
    }),
);
await check("certificate records are private and cannot be self-issued", () =>
  as("authenticated", userB, async () => {
    assert.equal(
      (await db.query("select * from public.certificates")).rows.length,
      0,
    );
    await assert.rejects(() =>
      db.query("select public.issue_certificate($1,$2)", [
        userB,
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      ]),
    );
  }),
);
let paymentReference;
await check(
  "checkout locks a canonical course fee and reuses pending checkout",
  () =>
    as("service_role", "", async () => {
      await db.exec(
        "update public.courses set status='published',price_minor=5000 where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'",
      );
      const first = await db.query(
        "select public.begin_checkout($1,$2,'learner@example.test','test') as t",
        [userB, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
      );
      paymentReference = first.rows[0].t.reference;
      assert.equal(first.rows[0].t.amount_minor, 5000);
      const second = await db.query(
        "select public.begin_checkout($1,$2,'learner@example.test','test') as t",
        [userB, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
      );
      assert.equal(second.rows[0].t.reference, paymentReference);
      assert.equal(second.rows[0].t.created, false);
    }),
);
await check(
  "payment settlement rejects wrong amount, currency, customer and environment",
  () =>
    as("service_role", "", async () => {
      for (const args of [
        [4000, "NGN", "test", "learner@example.test"],
        [5000, "USD", "test", "learner@example.test"],
        [5000, "NGN", "live", "learner@example.test"],
        [5000, "NGN", "test", "other@example.test"],
      ])
        await assert.rejects(() =>
          db.query(
            "select public.settle_payment($1,$2,$3,'event-test',$4,$5)",
            [paymentReference, ...args],
          ),
        );
    }),
);
await check(
  "verified test payments never unlock paid enrolment and duplicate events are idempotent",
  () =>
    as("service_role", "", async () => {
      await db.query(
        "select public.settle_payment($1,5000,'NGN','event-test','test','learner@example.test')",
        [paymentReference],
      );
      await db.query(
        "select public.settle_payment($1,5000,'NGN','event-test','test','learner@example.test')",
        [paymentReference],
      );
      assert.equal(
        (
          await db.query("select * from public.enrolments where user_id=$1", [
            userB,
          ])
        ).rows.length,
        0,
      );
    }),
);
await check(
  "only verified live settlement activates paid enrolment atomically",
  () =>
    as("service_role", "", async () => {
      const first = await db.query(
        "select public.begin_checkout($1,$2,'learner@example.test','live') as t",
        [userB, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
      );
      await db.query(
        "select public.settle_payment($1,5000,'NGN','event-live','live','learner@example.test')",
        [first.rows[0].t.reference],
      );
      assert.equal(
        (
          await db.query(
            "select status from public.enrolments where user_id=$1",
            [userB],
          )
        ).rows[0].status,
        "active",
      );
    }),
);
await check(
  "customer cannot call settlement, claim emails or read others support",
  () =>
    as("authenticated", userA, async () => {
      await assert.rejects(() =>
        db.query(
          "select public.settle_payment($1,5000,'NGN','forge','live','learner@example.test')",
          [paymentReference],
        ),
      );
      await assert.rejects(() =>
        db.query("select * from public.claim_email_jobs()"),
      );
      assert.equal(
        (await db.query("select * from public.email_jobs")).rows.length,
        0,
      );
    }),
);
await check(
  "email enqueue and delivery events are deduplicated and terminal complaints stay terminal",
  () =>
    as("service_role", "", async () => {
      await db.exec(
        "insert into public.email_jobs(dedupe_key,kind,recipient,payload,provider_id,status) values('unit-event','enquiry_ack','unit@example.test','{}','provider-unit','accepted')",
      );
      await db.query(
        "select public.record_email_event('evt-1','provider-unit','delivered',now())",
      );
      await db.query(
        "select public.record_email_event('evt-1','provider-unit','sent',now())",
      );
      assert.equal(
        (
          await db.query(
            "select provider_status from public.email_jobs where provider_id='provider-unit'",
          )
        ).rows[0].provider_status,
        "delivered",
      );
      await db.query(
        "select public.record_email_event('evt-2','provider-unit','complained',now())",
      );
      await db.query(
        "select public.record_email_event('evt-3','provider-unit','delivered',now())",
      );
      assert.equal(
        (
          await db.query(
            "select provider_status from public.email_jobs where provider_id='provider-unit'",
          )
        ).rows[0].provider_status,
        "complained",
      );
    }),
);
await check(
  "synthetic enquiry notifications are suppressed and private keys have no client policy",
  () =>
    as("service_role", "", async () => {
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from public.email_jobs where enquiry_id is not null and status<>'suppressed'",
          )
        ).rows[0].n,
        0,
      );
    }),
);

await db.query("update auth.users set email='support@example.test' where id=$1",[userB]);
let supportId;
await check("support requests have atomic user rate limits",()=>as("service_role","",async()=>{for(let n=0;n<5;n++){const r=await db.query("select public.create_support_ticket($1,'Access help','Synthetic support request') as id",[userB]);if(n===0)supportId=r.rows[0].id;}await assert.rejects(()=>db.query("select public.create_support_ticket($1,'More help','Synthetic support request')",[userB]));}));
await check("learners cannot read or reply to another learner's support ticket",()=>as("authenticated",userA,async()=>{assert.equal((await db.query("select * from public.support_tickets where id=$1",[supportId])).rows.length,0);await assert.rejects(()=>db.query("insert into public.support_replies(ticket_id,author_id,body) values($1,$2,'Invalid cross-user reply')",[supportId,userA]));await assert.rejects(()=>db.query("insert into public.support_tickets(user_id,subject,body) values($1,'Bypass','Synthetic direct insert')",[userA]));}));
await check("staff support replies enqueue private notifications and remain visible to the owner",async()=>{await as("authenticated",admin,()=>db.query("insert into public.support_replies(ticket_id,author_id,body) values($1,$2,'A synthetic staff response')",[supportId,admin]));await as("authenticated",userB,async()=>{assert.equal((await db.query("select * from public.support_replies where ticket_id=$1",[supportId])).rows.length,1);});});
await check("free enrolment rejects paid courses and only activates a published zero-fee course",()=>as("service_role","",async()=>{await assert.rejects(()=>db.query("select public.enrol_free_course($1,$2)",[userA,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']));await db.exec("insert into public.courses(id,slug,title,description,status,price_minor) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','free-fixture','Free fixture','Synthetic local course','published',0)");await db.query("select public.enrol_free_course($1,$2)",[userB,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee']);assert.equal((await db.query("select status from public.enrolments where user_id=$1 and course_id=$2",[userB,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'])).rows[0].status,'active');}));
await check("new email worker leases jobs once and excludes suppressed/accepted messages",()=>as("service_role","",async()=>{await db.exec("insert into public.email_jobs(dedupe_key,kind,recipient) values('lease-unit','enquiry_ack','unit@example.invalid')");const first=await db.query("select * from public.claim_email_jobs()");assert.ok(first.rows.some(j=>j.dedupe_key==='lease-unit'));assert.ok(first.rows.every(j=>j.status==='processing'));assert.equal((await db.query("select * from public.claim_email_jobs()")).rows.length,0);}));
console.log(
  `${passed} isolated PostgreSQL checks passed. Auth/Storage API and hosted restore remain release gates.`,
);
await db.close();
