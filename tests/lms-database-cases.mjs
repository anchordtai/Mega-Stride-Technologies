import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
export async function runLmsChecks({ db, as, check, userA, userB, admin }) {
  await check(
    "instructor-ready migration applies after the prior release",
    async () =>
      db.exec(
        await readFile(
          new URL(
            "../supabase/migrations/20261112104410_instructor_ready_lms.sql",
            import.meta.url,
          ),
          "utf8",
        ),
      ),
  );

  await check("paid-access RPC keeps privileged logic outside the exposed schema",async()=>{
    await db.exec(await readFile(new URL("../supabase/migrations/20261112104524_private_learning_access_helper.sql",import.meta.url),"utf8"));
    assert.equal((await db.query("select prosecdef from pg_proc where oid='public.my_learning_access(uuid)'::regprocedure")).rows[0].prosecdef,false);
  });
  const teacher = "55555555-5555-4555-8555-555555555555",
    other = "66666666-6666-4666-8666-666666666666";
  await db.exec(
    `insert into auth.users(id) values('${teacher}'),('${other}');insert into private.staff_roles values('${teacher}','instructor'),('${other}','instructor');`,
  );
  const course = (
    await db.query(
      "update public.courses set instructor_id=$1,academic_status='approved',status='published' where academy_code='cloud' returning id",
      [teacher],
    )
  ).rows[0].id;
  const course2 = (
    await db.query(
      "update public.courses set instructor_id=$1,academic_status='approved',status='published' where academy_code='marketing' returning id",
      [other],
    )
  ).rows[0].id;
  const module = (
    await db.query(
      "insert into public.academy_modules(course_id,title,position,published) values($1,'Foundations',1,true) returning id",
      [course],
    )
  ).rows[0].id;
  const lesson = (
    await db.query(
      "insert into public.lessons(course_id,module_id,title,body,position,published) values($1,$2,'Cloud foundations','Useful student instruction',1,true) returning id",
      [course, module],
    )
  ).rows[0].id;
  await db.query(
    "insert into public.lessons(course_id,title,body,position,published) values($1,'Private marketing lesson','Restricted second course',1,true)",
    [course2],
  );
  await db.query(
    "insert into public.academic_documents(course_id,module_id,title,kind,audience,body,status) values($1,$2,'Student notes','lecture','student','Approved student content for learning','approved'),($1,$2,'Instructor key','answer_key','instructor','SECRET ANSWERS MUST NOT LEAK','approved')",
    [course, module],
  );
  await db.query(
    "insert into public.enrolments(user_id,course_id,status) values($1,$2,'active') on conflict(user_id,course_id) do update set status='active'",
    [userA, course],
  );
  await check(
    "all five Academy course fees are fixed at 15000 naira",
    async () => {
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from public.courses where academy_code is not null and price_minor=1500000",
          )
        ).rows[0].n,
        5,
      );
      await assert.rejects(
        db.query("update public.courses set price_minor=0 where id=$1", [
          course,
        ]),
      );
    },
  );
  await check(
    "active enrolment without verified payment cannot read lessons",
    () =>
      as("authenticated", userA, async () => {
        assert.equal(
          (
            await db.query("select * from public.lessons where course_id=$1", [
              course,
            ])
          ).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select public.my_learning_access($1) ok", [course]))
            .rows[0].ok,
          false,
        );
      }),
  );
  await check(
    "instructor only reads assigned courses and cannot reassign ownership",
    () =>
      as("authenticated", teacher, async () => {
        assert.equal(
          (
            await db.query("select * from public.lessons where course_id=$1", [
              course,
            ])
          ).rows.length,
          1,
        );
        assert.equal(
          (
            await db.query("select * from public.lessons where course_id=$1", [
              course2,
            ])
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "update public.courses set instructor_id=$1 where id=$2 returning id",
              [teacher, course2],
            )
          ).rows.length,
          0,
        );
      }),
  );
  await check(
    "approved curriculum cannot be weakened by an instructor lesson edit",
    () =>
      as("authenticated", teacher, async () => {
        assert.equal(
          (
            await db.query(
              "update public.lessons set published=false where id=$1 returning id",
              [lesson],
            )
          ).rows.length,
          0,
        );
      }),
  );
  await db.query(
    "insert into public.transactions(user_id,course_id,provider,reference,amount_minor,currency,status,mode,customer_email) values($1,$2,'paystack','LMS-TEST',1500000,'NGN','verified','test','learner@example.invalid')",
    [userA, course],
  );
  await check(
    "test payment does not unlock lessons even with an active enrolment",
    () =>
      as("authenticated", userA, async () =>
        assert.equal(
          (
            await db.query("select * from public.lessons where course_id=$1", [
              course,
            ])
          ).rows.length,
          0,
        ),
      ),
  );
  await db.query(
    "update public.transactions set mode='live' where reference='LMS-TEST'",
  );
  await check("verified live payment unlocks one course only", () =>
    as("authenticated", userA, async () => {
      assert.equal(
        (
          await db.query("select * from public.lessons where course_id=$1", [
            course,
          ])
        ).rows.length,
        1,
      );
      assert.equal(
        (
          await db.query("select * from public.lessons where course_id=$1", [
            course2,
          ])
        ).rows.length,
        0,
      );
    }),
  );
  await check(
    "student cannot inspect instructor documents or private keys",
    () =>
      as("authenticated", userA, async () => {
        const docs = await db.query(
          "select * from public.academic_documents where course_id=$1",
          [course],
        );
        assert.equal(docs.rows.length, 1);
        assert.equal(docs.rows[0].audience, "student");
        await assert.rejects(db.query("select * from private.assessment_keys"));
      }),
  );
  const task = (
    await db.query(
      "insert into public.academy_tasks(course_id,module_id,title,kind,instructions,published) values($1,$2,'Design lab','lab','Submit a design and a test report with evidence.',true) returning id",
      [course, module],
    )
  ).rows[0].id;
  const project = (
    await db.query(
      "insert into public.academy_tasks(course_id,title,kind,instructions,published) values($1,'Final cloud project','project','Demonstrate the full deployment and recovery process.',true) returning id",
      [course],
    )
  ).rows[0].id;
  let submission;
  await check(
    "unpaid learner cannot submit a practical task by calling the server routine",
    () =>
      as("service_role", "", () =>
        assert.rejects(
          db.query("select public.submit_academy_task($1,$2,$3)", [
            userB,
            task,
            "A realistic but unauthorized submission body.",
          ]),
        ),
      ),
  );
  await as("service_role", "", async () => {
    submission = (
      await db.query("select public.submit_academy_task($1,$2,$3) id", [
        userA,
        task,
        "Cloud design with access boundaries, validation and cleanup evidence.",
      ])
    ).rows[0].id;
  });
  await check("learner cannot forge marks or call privileged grading", () =>
    as("authenticated", userA, async () => {
      await assert.rejects(
        db.query(
          "update public.academy_submissions set score=100 where id=$1",
          [submission],
        ),
      );
      await assert.rejects(
        db.query("select public.grade_academy_task($1,$2,100,$3)", [
          userA,
          submission,
          "Attempt to grade my own submission.",
        ]),
      );
    }),
  );
  await check(
    "unassigned instructor is rejected while assigned instructor can grade",
    () =>
      as("service_role", "", async () => {
        await assert.rejects(
          db.query("select public.grade_academy_task($1,$2,90,$3)", [
            other,
            submission,
            "Grading without a course assignment.",
          ]),
        );
        await db.query("select public.grade_academy_task($1,$2,90,$3)", [
          teacher,
          submission,
          "Correct boundaries and meaningful negative tests.",
        ]);
      }),
  );
  await check(
    "other learner cannot read submissions and instructor cannot read finance",
    async () => {
      await as("authenticated", userB, async () =>
        assert.equal(
          (
            await db.query(
              "select * from public.academy_submissions where id=$1",
              [submission],
            )
          ).rows.length,
          0,
        ),
      );
      await as("authenticated", teacher, async () =>
        assert.equal(
          (
            await db.query(
              "select * from public.transactions where reference='LMS-TEST'",
            )
          ).rows.length,
          0,
        ),
      );
    },
  );
  await check(
    "learning resume validates the exact enrolled course and lesson",
    () =>
      as("service_role", "", async () => {
        await db.query("select public.save_learning_position($1,$2,$3)", [
          userA,
          course,
          lesson,
        ]);
        await assert.rejects(
          db.query("select public.save_learning_position($1,$2,$3)", [
            userA,
            course2,
            lesson,
          ]),
        );
      }),
  );
  let aid;
  await as("service_role", "", async () => {
    aid = (
      await db.query(
        `select public.save_assessment($1,'Final examination','[{"prompt":"Which approach limits access?","options":["Least privilege","Administrator everywhere"]}]'::jsonb,'[0]'::jsonb,70,3,true) id`,
        [course],
      )
    ).rows[0].id;
    await db.query("select public.grade_assessment($1,$2,1,'[0]'::jsonb)", [
      userA,
      aid,
    ]);
  });
  await db.query(
    "insert into public.lesson_progress(user_id,lesson_id) values($1,$2)",
    [userA, lesson],
  );
  await check(
    "certificate refuses uncompleted required project despite quiz pass",
    () =>
      as("service_role", "", () =>
        assert.rejects(
          db.query("select public.issue_certificate($1,$2)", [userA, course]),
        ),
      ),
  );
  await as("service_role", "", async () => {
    const sid = (
      await db.query("select public.submit_academy_task($1,$2,$3) id", [
        userA,
        project,
        "A complete cloud project report with restoration and teardown evidence.",
      ])
    ).rows[0].id;
    await db.query("select public.grade_academy_task($1,$2,85,$3)", [
      teacher,
      sid,
      "Deployment, recovery and teardown evidence accepted.",
    ]);
  });
  await check(
    "certificate requires paid access, lessons, required practicals and final exam",
    () =>
      as("service_role", "", async () =>
        assert.match(
          (
            await db.query("select public.issue_certificate($1,$2) code", [
              userA,
              course,
            ])
          ).rows[0].code,
          /^[a-f0-9]{32}$/,
        ),
      ),
  );
  await check("refund removes paid learning access", async () => {
    await db.query(
      "update public.transactions set status='refunded' where reference='LMS-TEST'",
    );
    await as("authenticated", userA, async () =>
      assert.equal(
        (await db.query("select public.my_learning_access($1) ok", [course]))
          .rows[0].ok,
        false,
      ),
    );
  });
  await check("only administrators grant audited learning overrides", () =>
    as("service_role", "", async () => {
      await assert.rejects(
        db.query("select public.set_learning_override($1,$2,$3,$4,false)", [
          teacher,
          userA,
          course,
          "Unauthorized free-access attempt by an instructor.",
        ]),
      );
      await db.query("select public.set_learning_override($1,$2,$3,$4,false)", [
        admin,
        userA,
        course,
        "Approved corporate scholarship for this isolated test fixture.",
      ]);
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from public.audit_logs where entity='learning_override' and actor_id=$1",
            [admin],
          )
        ).rows[0].n,
        1,
      );
    }),
  );
  await check(
    "instructor cannot publish approved academic content without administration",
    () =>
      as("authenticated", teacher, async () => {
        await assert.rejects(
          db.query(
            "insert into public.academic_documents(course_id,title,kind,audience,body,status) values($1,'Not reviewed','lecture','student','Material that has not been approved by administration.','approved')",
            [course],
          ),
        );
      }),
  );
}
