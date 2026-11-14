import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
export async function runBusinessChecks({ db, as, check }) {
  await check(
    "Business Desk additive schema and security functions apply",
    () =>
      readFile(
        new URL(
          "../supabase/migrations/20261114105720_business_desk_foundation.sql",
          import.meta.url,
        ),
        "utf8",
      ).then((sql) => db.exec(sql)),
  );
  const owner = "77777777-7777-4777-8777-777777777777";
  const service = (sql, args = []) =>
    as("service_role", null, () => db.query(sql, args));
  const cmd = async (action, p = {}, actor = owner) =>
    (
      await service("select msbd_command($1,$2,$3::jsonb) result", [
        actor,
        action,
        JSON.stringify(p),
      ])
    ).rows[0].result;
  const client = await cmd("client_save", {
    name: "Synthetic Test Client",
    email: "business-client@example.invalid",
    kind: "corporate",
    profile: { address: "Test address" },
  });
  let quotation, invoice, payment;
  const content = {
    title: "Test project",
    currency: "NGN",
    items: [
      {
        description: "Engineering services",
        quantity_milli: 2500,
        unit_minor: 10000,
        discount_minor: 1000,
      },
      { description: "Deployment", quantity_milli: 1000, unit_minor: 5000 },
    ],
    discount_minor: 1000,
    charges_minor: 300,
    delivery_minor: 200,
    tax_bps: 0,
    terms: "Controlled test terms",
  };
  await check(
    "Business client duplication is rejected and account role does not grant finance access",
    async () => {
      await assert.rejects(() =>
        cmd("client_save", {
          name: "Duplicate",
          email: "business-client@example.invalid",
          kind: "corporate",
        }),
      );
      assert.equal(
        (
          await as("authenticated", owner, () =>
            db.query("select my_business_role() role"),
          )
        ).rows[0].role,
        "super_admin",
      );
      for (const role of ["anon", "authenticated"])
        assert.equal(
          (
            await db.query(
              "select has_function_privilege($1,'public.msbd_command(uuid,text,jsonb)','EXECUTE') ok",
              [role],
            )
          ).rows[0].ok,
          false,
        );
    },
  );
  await check(
    "Document totals use exact fractional quantity arithmetic and configured taxes only",
    async () => {
      quotation = await cmd("document_save", {
        kind: "quotation",
        client_id: client.id,
        content,
        due_date: "2099-12-31",
      });
      const q = (
        await db.query("select * from msbd_documents where id=$1", [
          quotation.id,
        ])
      ).rows[0];
      assert.equal(q.content.total_minor, 28500);
      assert.equal(q.content.subtotal_minor, 30000);
      await assert.rejects(() =>
        cmd("document_save", {
          kind: "quotation",
          client_id: client.id,
          content: { ...content, tax_bps: 750 },
          due_date: "2099-12-31",
        }),
      );
    },
  );
  await check(
    "Approval precedes issue; issued snapshots are immutable and numbered uniquely",
    async () => {
      await assert.rejects(() => cmd("issue", { id: quotation.id }));
      await cmd("submit", { id: quotation.id });
      await cmd("approve", { id: quotation.id });
      await cmd("issue", { id: quotation.id });
      const q = (
        await db.query("select * from msbd_documents where id=$1", [
          quotation.id,
        ])
      ).rows[0];
      assert.match(q.number, /^MST\/QTN\/\d{4}\/\d{6}$/);
      assert.equal(q.company_snapshot.name, "Mega Stride Technologies Limited");
      assert.equal(q.content_hash.length, 64);
      await assert.rejects(() =>
        db.query("update msbd_documents set content='{}' where id=$1", [
          quotation.id,
        ]),
      );
      await assert.rejects(() =>
        db.query("delete from msbd_documents where id=$1", [quotation.id]),
      );
    },
  );
  await check(
    "Approved quotation conversion preserves amounts and rejects duplicate invoices",
    async () => {
      invoice = await cmd("quotation_convert", {
        id: quotation.id,
        due_date: "2099-12-31",
      });
      assert.equal(
        (
          await db.query("select content from msbd_documents where id=$1", [
            invoice.id,
          ])
        ).rows[0].content.total_minor,
        28500,
      );
      await assert.rejects(() =>
        cmd("quotation_convert", { id: quotation.id }),
      );
      await cmd("submit", { id: invoice.id });
      await cmd("approve", { id: invoice.id });
      await cmd("issue", { id: invoice.id });
    },
  );
  await check(
    "Pending payments cannot issue receipts; confirmed partial payment creates one receipt idempotently",
    async () => {
      payment = await cmd("payment_record", {
        invoice_id: invoice.id,
        reference: "TEST-TRANSFER-ONLY",
        amount_minor: 10000,
        method: "bank_transfer",
        payment_date: "2026-11-14",
        evidence: "Isolated simulated evidence, never production",
      });
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from msbd_documents where kind='receipt'",
          )
        ).rows[0].n,
        0,
      );
      await assert.rejects(() =>
        cmd("payment_confirm", {
          id: payment.id,
          reason: "Controlled reconciliation test",
          confirmed_received: false,
        }),
      );
      const a = await cmd("payment_confirm", {
        id: payment.id,
        reason: "Controlled reconciliation test",
        confirmed_received: true,
      });
      const b = await cmd("payment_confirm", {
        id: payment.id,
        reason: "Controlled reconciliation test",
        confirmed_received: true,
      });
      assert.equal(a.receipt_id, b.receipt_id);
      assert.equal(
        (
          await service("select msbd_invoice_balance($1,$2) b", [
            owner,
            invoice.id,
          ])
        ).rows[0].b.outstanding_minor,
        18500,
      );
      await assert.rejects(() =>
        cmd("payment_record", {
          invoice_id: invoice.id,
          reference: "OVERPAYMENT-TEST",
          amount_minor: 20000,
          method: "cash",
          payment_date: "2026-11-14",
        }),
      );
    },
  );
  await check(
    "Public verification is token-scoped and excludes private client and payment data",
    async () => {
      const q = (
        await db.query("select token from msbd_documents where id=$1", [
          invoice.id,
        ])
      ).rows[0];
      const result = (
        await service("select msbd_verification($1,$2) result", [
          q.token,
          "a".repeat(64),
        ])
      ).rows[0].result;
      assert.equal(result.status, "partially_paid");
      assert.equal(result.client, "Client details protected");
      for (const field of [
        "id",
        "email",
        "amount_minor",
        "total_minor",
        "address",
        "payment_reference",
        "token",
      ])
        assert.equal(Object.hasOwn(result, field), false);
    },
  );
  await check(
    "Business reports keep confirmed cash and unpaid invoices separate by currency",
    async () => {
      const report = (await service("select msbd_report($1) r", [owner]))
        .rows[0].r;
      assert.equal(report.finance[0].retained_minor, 10000);
      assert.equal(report.receivables[0].outstanding_minor, 18500);
      assert.equal(report.statuses.partially_paid, 1);
    },
  );
  const sales = "c1111111-1111-4111-8111-111111111111",
    finance = "c2222222-2222-4222-8222-222222222222",
    portal = "c3333333-3333-4333-8333-333333333333",
    stranger = "c4444444-4444-4444-8444-444444444444";
  await db.query(
    "insert into auth.users(id,email,email_confirmed_at) values($1,'sales@example.invalid',now()),($2,'finance@example.invalid',now()),($3,'business-client@example.invalid',now()),($4,'unrelated-client@example.invalid',now())",
    [sales, finance, portal, stranger],
  );
  await cmd("role", {
    id: sales,
    role: "sales",
    reason: "Assign isolated business sales role",
  });
  await cmd("role", {
    id: finance,
    role: "finance",
    reason: "Assign isolated business finance role",
  });
  await check(
    "Sales cannot inspect unassigned clients, confirm payments or read owner role records",
    async () => {
      assert.equal(
        (
          await as("authenticated", sales, () =>
            db.query("select * from msbd_clients where id=$1", [client.id]),
          )
        ).rows.length,
        0,
      );
      await assert.rejects(() =>
        cmd(
          "payment_confirm",
          {
            id: payment.id,
            confirmed_received: true,
            reason: "Unauthorized sales confirmation",
          },
          sales,
        ),
      );
      await assert.rejects(() =>
        service("select msbd_roles_list($1)", [sales]),
      );
      await assert.rejects(() =>
        service("select msbd_roles_list($1)", [stranger]),
      );
      await assert.rejects(() =>
        service("select msbd_invoice_balance($1,$2)", [stranger, invoice.id]),
      );
      const mine = await cmd(
        "client_save",
        {
          name: "Sales-owned client",
          email: "sales-owned@example.invalid",
          kind: "corporate",
        },
        sales,
      );
      assert.equal(
        (
          await as("authenticated", sales, () =>
            db.query("select id from msbd_clients where id=$1", [mine.id]),
          )
        ).rows.length,
        1,
      );
    },
  );
  await check(
    "Portal links require exact verified client identity; clients cannot read other records or staff notes",
    async () => {
      await assert.rejects(() =>
        cmd("client_portal", {
          id: client.id,
          portal_user: stranger,
          reason: "Incorrect identity must be rejected",
        }),
      );
      await cmd("client_portal", {
        id: client.id,
        portal_user: portal,
        reason: "Verified exact client identity test",
      });
      await cmd("client_note", {
        client_id: client.id,
        body: "Private staff note, not portal content.",
      });
      assert.equal(
        (
          await as("authenticated", portal, () =>
            db.query("select count(*)::int n from msbd_documents"),
          )
        ).rows[0].n,
        3,
      );
      assert.equal(
        (
          await as("authenticated", portal, () =>
            db.query("select * from msbd_client_notes"),
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await as("authenticated", stranger, () =>
            db.query("select * from msbd_documents"),
          )
        ).rows.length,
        0,
      );
      await assert.rejects(() =>
        as("authenticated", portal, () =>
          db.query("update msbd_payments set status='confirmed'"),
        ),
      );
    },
  );
  await check(
    "Client acceptance needs explicit terms and binds the exact issued version",
    async () => {
      const q = await cmd("document_save", {
        kind: "quotation",
        client_id: client.id,
        content,
        due_date: "2099-12-31",
      });
      await cmd("submit", { id: q.id });
      await cmd("approve", { id: q.id });
      await cmd("issue", { id: q.id });
      await assert.rejects(() =>
        service("select msbd_client_response($1,$2,'accepted',false,'')", [
          portal,
          q.id,
        ]),
      );
      await assert.rejects(() =>
        service("select msbd_client_response($1,$2,'accepted',true,'')", [
          stranger,
          q.id,
        ]),
      );
      await service(
        "select msbd_client_response($1,$2,'accepted',true,'Controlled explicit acceptance')",
        [portal, q.id],
      );
      const accepted = (
        await db.query("select * from msbd_documents where id=$1", [q.id])
      ).rows[0];
      assert.equal(accepted.status, "accepted");
      assert.equal(accepted.acceptance.document_hash, accepted.content_hash);
      await cmd("document_revise", {
        id: q.id,
        reason: "Controlled quotation revision test",
        due_date: "2099-12-31",
      });
      assert.equal(
        (
          await db.query("select status from msbd_documents where id=$1", [
            q.id,
          ])
        ).rows[0].status,
        "superseded",
      );
    },
  );
  await check(
    "Credit notes, exact schedule validation and actual refund reversals preserve financial controls",
    async () => {
      await assert.rejects(() =>
        cmd("document_save", {
          kind: "invoice",
          client_id: client.id,
          content: {
            ...content,
            schedule: [
              {
                label: "Wrong milestone",
                amount_minor: 1,
                due_date: "2099-01-01",
              },
            ],
          },
        }),
      );
      await assert.rejects(() =>
        cmd("credit_note", {
          invoice_id: invoice.id,
          amount_minor: 20000,
          reason: "Credit too large must be rejected",
        }),
      );
      await cmd("credit_note", {
        invoice_id: invoice.id,
        amount_minor: 500,
        reason: "Controlled credit note against unpaid balance",
      });
      assert.equal(
        (
          await service("select msbd_invoice_balance($1,$2) b", [
            owner,
            invoice.id,
          ])
        ).rows[0].b.outstanding_minor,
        18000,
      );
      await assert.rejects(() =>
        cmd("payment_reverse", {
          id: payment.id,
          reason: "Controlled refund requires actual confirmation",
          reversal_reference: "REV-TEST",
          refund_completed: false,
        }),
      );
      await cmd("payment_reverse", {
        id: payment.id,
        reason: "Controlled actual reversal test only",
        reversal_reference: "REV-TEST",
        refund_completed: true,
      });
      assert.equal(
        (
          await service("select msbd_invoice_balance($1,$2) b", [
            owner,
            invoice.id,
          ])
        ).rows[0].b.outstanding_minor,
        28000,
      );
      assert.equal(
        (
          await db.query(
            "select d.status from msbd_documents d join msbd_payments p on p.receipt_id=d.id where p.id=$1",
            [payment.id],
          )
        ).rows[0].status,
        "cancelled",
      );
    },
  );

  await check(
    "Business notification queue requires owner opt-in and never treats queued mail as delivered",
    async () => {
      assert.equal(
        (await db.query("select count(*)::int n from msbd_email_jobs")).rows[0]
          .n,
        0,
      );
      const settings = (await db.query("select profile from msbd_settings"))
        .rows[0].profile;
      await cmd("settings", {
        profile: { ...settings, notifications_enabled: true },
      });
      const q = await cmd("document_save", {
        kind: "quotation",
        client_id: client.id,
        content,
        due_date: "2099-12-31",
      });
      await cmd("submit", { id: q.id });
      await cmd("approve", { id: q.id });
      await cmd("issue", { id: q.id });
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from msbd_email_jobs where document_id=$1",
            [q.id],
          )
        ).rows[0].n,
        3,
      );
      await cmd("document_email", { id: q.id });
      await cmd("document_email", { id: q.id });
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from msbd_email_jobs where document_id=$1 and event='document_issued'",
            [q.id],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from msbd_email_jobs where provider_status='delivered'",
          )
        ).rows[0].n,
        0,
      );
      await service("select msbd_record_view($1,$2)", [portal, q.id]);
      await service("select msbd_record_view($1,$2)", [portal, q.id]);
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from msbd_events where document_id=$1 and action='document_viewed'",
            [q.id],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  await check(
    "Account statements snapshot the current ledger and partial refunds change remaining invoice balance",
    async () => {
      const statement = await cmd("statement", {
        client_id: client.id,
        currency: "NGN",
      });
      assert.equal(
        (
          await db.query("select kind from msbd_documents where id=$1", [
            statement.id,
          ])
        ).rows[0].kind,
        "statement",
      );
      const p = await cmd("payment_record", {
        invoice_id: invoice.id,
        reference: "PARTIAL-REFUND-TEST",
        amount_minor: 1000,
        method: "cash",
        payment_date: "2026-11-14",
        evidence: "Controlled isolated evidence",
      });
      const receipt = await cmd("payment_confirm", {
        id: p.id,
        confirmed_received: true,
        reason: "Controlled partial refund setup test",
      });
      const before = (
        await service("select msbd_invoice_balance($1,$2) b", [
          owner,
          invoice.id,
        ])
      ).rows[0].b.outstanding_minor;
      await cmd("payment_reverse", {
        id: p.id,
        amount_minor: 400,
        refund_completed: true,
        reversal_reference: "PARTIAL-REFUND-REF",
        reason: "Controlled isolated partial refund record",
      });
      assert.equal(
        (
          await service("select msbd_invoice_balance($1,$2) b", [
            owner,
            invoice.id,
          ])
        ).rows[0].b.outstanding_minor,
        before + 400,
      );
      assert.equal(
        (
          await db.query("select status from msbd_documents where id=$1", [
            receipt.receipt_id,
          ])
        ).rows[0].status,
        "partially_refunded",
      );
      assert.equal(
        (
          await as("authenticated", portal, () =>
            db.query("select * from msbd_payments"),
          )
        ).rows.length,
        0,
      );
      await assert.rejects(() =>
        cmd("payment_reverse", {
          id: p.id,
          amount_minor: 700,
          refund_completed: true,
          reversal_reference: "TOO-MUCH-REFUND",
          reason: "Excessive partial refund must be rejected",
        }),
      );
    },
  );
  await check(
    "Extended quotation requests preserve spam controls and convert safely to a client record",
    async () => {
      const payload = {
        kind: "quotation",
        name: "Synthetic prospect",
        email: "new-business-request@example.invalid",
        company: "Synthetic business",
        phone: "",
        country: "Nigeria",
        service: "Software development",
        subject: "Controlled quotation request",
        message: "An isolated test project requirement only.",
        state: "Abuja",
        budget: "Test budget only",
        preferred_contact: "email",
        submission_key: "d0".repeat(24),
      };
      const reference = (
        await service("select submit_enquiry($1::jsonb,$2) r", [
          JSON.stringify(payload),
          "b".repeat(64),
        ])
      ).rows[0].r;
      const enquiry = (
        await db.query("select id,details from enquiries where reference=$1", [
          reference,
        ])
      ).rows[0];
      assert.equal(enquiry.details.state, "Abuja");
      assert.equal(enquiry.details.preferred_contact, "email");
      const converted = await cmd("request_convert", { id: enquiry.id });
      assert.equal(
        (
          await db.query("select email from msbd_clients where id=$1", [
            converted.client_id,
          ])
        ).rows[0].email,
        payload.email,
      );
    },
  );

  await check(
    "Minimal identity lookups work for authorised staff without exposing raw Auth tables",
    async () => {
      assert.equal(
        (
          await db.query(
            "select has_table_privilege('service_role','auth.users','SELECT') ok",
          )
        ).rows[0].ok,
        false,
      );
      const roles = (await service("select msbd_roles_list($1) r", [owner]))
        .rows[0].r;
      assert.equal(roles.find((x) => x.id === sales).role, "sales");
      const directory = (
        await service("select msbd_staff_directory($1) r", [finance])
      ).rows[0].r;
      assert.equal(
        directory.some((x) => x.id === sales),
        true,
      );
      assert.equal(
        directory.some((x) => x.id === portal),
        false,
      );
      await assert.rejects(() =>
        service("select msbd_staff_directory($1)", [sales]),
      );
      await assert.rejects(() =>
        as("authenticated", portal, () =>
          db.query("select private.msbd_verified_email($1)", [portal]),
        ),
      );
      await assert.rejects(() =>
        as("authenticated", sales, () =>
          db.query("select private.msbd_roles_list_identities($1)", [owner]),
        ),
      );
    },
  );
  await check(
    "Document filters respect sales assignments, management approval scope and client restrictions",
    async () => {
      const manager = "c5555555-5555-4555-8555-555555555555";
      await db.query(
        "insert into auth.users(id,email,email_confirmed_at) values($1,'manager@example.invalid',now())",
        [manager],
      );
      await cmd("role", {
        id: manager,
        role: "management",
        reason: "Controlled isolated management role",
      });
      const draft = await cmd("document_save", {
        kind: "quotation",
        client_id: client.id,
        content,
        due_date: "2099-12-31",
      });
      const list = (actor, kind, state = null) =>
        as("authenticated", actor, () =>
          db.query("select msbd_document_list($1,$2) r", [kind, state]),
        );
      assert.equal(
        (await list(owner, "quotation")).rows[0].r.rows.some(
          (x) => x.id === draft.id,
        ),
        true,
      );
      assert.equal(
        (await list(manager, "quotation")).rows[0].r.rows.some(
          (x) => x.id === draft.id,
        ),
        false,
      );
      assert.equal(
        (await list(sales, "quotation")).rows[0].r.rows.some(
          (x) => x.client_id === client.id,
        ),
        false,
      );
      const filtered = (await list(owner, "invoice", "partially_paid")).rows[0]
        .r;
      assert.equal(
        filtered.rows.some((x) => x.id === invoice.id),
        true,
      );
      await assert.rejects(() => list(portal, "quotation"));
    },
  );
  await check(
    "Portal access follows current verified email and client email changes remove stale links",
    async () => {
      await db.query(
        "update auth.users set email='changed-identity@example.invalid' where id=$1",
        [portal],
      );
      assert.equal(
        (
          await as("authenticated", portal, () =>
            db.query("select * from msbd_documents"),
          )
        ).rows.length,
        0,
      );
      await assert.rejects(() =>
        service("select msbd_invoice_balance($1,$2)", [portal, invoice.id]),
      );
      await assert.rejects(() =>
        service("select msbd_record_view($1,$2)", [portal, invoice.id]),
      );
      await db.query(
        "update auth.users set email='business-client@example.invalid' where id=$1",
        [portal],
      );
      await cmd("client_save", {
        id: client.id,
        name: "Synthetic Test Client",
        email: "new-client-address@example.invalid",
        kind: "corporate",
      });
      assert.equal(
        (
          await db.query("select portal_user from msbd_clients where id=$1", [
            client.id,
          ])
        ).rows[0].portal_user,
        null,
      );
      await cmd("client_save", {
        id: client.id,
        name: "Synthetic Test Client",
        email: "business-client@example.invalid",
        kind: "corporate",
      });
      await cmd("client_portal", {
        id: client.id,
        link_matching_email: true,
        reason: "Relink exact verified client email test",
      });
      assert.equal(
        (
          await db.query("select portal_user from msbd_clients where id=$1", [
            client.id,
          ])
        ).rows[0].portal_user,
        portal,
      );
    },
  );
  await check(
    "Mail leases are exclusive and delivery webhooks preserve terminal bounce state",
    async () => {
      const first = (await service("select * from msbd_claim_email_jobs()"))
        .rows;
      const next = (await service("select * from msbd_claim_email_jobs()"))
        .rows;
      assert.ok(first.length > 0);
      assert.equal(
        next.some((x) => first.some((y) => x.id === y.id)),
        false,
      );
      await db.query(
        "update msbd_email_jobs set provider_id='isolated-provider-test',status='accepted' where id=$1",
        [first[0].id],
      );
      await service(
        "select msbd_record_email_event('isolated-provider-test','delivered','2026-11-14T10:00:00Z')",
      );
      assert.equal(
        (
          await db.query(
            "select provider_status from msbd_email_jobs where id=$1",
            [first[0].id],
          )
        ).rows[0].provider_status,
        "delivered",
      );
      await service(
        "select msbd_record_email_event('isolated-provider-test','bounced','2026-11-14T11:00:00Z')",
      );
      await service(
        "select msbd_record_email_event('isolated-provider-test','delivered','2026-11-14T12:00:00Z')",
      );
      assert.equal(
        (
          await db.query(
            "select provider_status from msbd_email_jobs where id=$1",
            [first[0].id],
          )
        ).rows[0].provider_status,
        "bounced",
      );
    },
  );
}
