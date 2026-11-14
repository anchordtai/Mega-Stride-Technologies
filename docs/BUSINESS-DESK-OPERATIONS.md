# Mega Stride Business Desk

## Release status · 14 November 2026

The module is implemented on the `feat/mega-stride-business-desk` branch and is prepared for review. **It has not been migrated into or deployed to production.** The owner explicitly approved publication of the implementation, migration SQL and technical documentation on 14 November 2026. The requested pre-migration application-data backup remains blocked by automatic approval review: explicit approval is required for the sensitive application data and the private ChatGPT-file destination. No backup data was exported. Do not apply the Business Desk migration, merge or deploy this branch until the backup prerequisite and release gates below are resolved.

The Academy release in PR #12 and the service-role registration fix in PR #13 are separately merged. The identity predicate migration is applied and verified on the hosted project. Public signup, pending course registration, verified-payment access routing and course sharing are live. Live Paystack credentials are absent, and public Auth email delivery remains unverified; paid checkout is not represented as operational.

## Architecture and isolation

The inspected application uses Next.js 16 App Router, React 19, TypeScript, Supabase Auth/PostgreSQL/private Storage, PDF-lib and the existing Resend notification integration. Vercel deploys the GitHub production branch. The existing enquiry form has persistent rate limits and a signed challenge or Turnstile. These mechanisms are reused.

Only the pinned Mega Stride project `okknsxrhbiiunjlaitcy` is permitted by `lib/supabase/config.ts`. No other application or database is used. Existing Academy transactions and legacy quotation records remain separate. No real client records, payments, receipts, staff grants or outgoing emails were fabricated during implementation. All finance workflow tests use an isolated PostgreSQL instance and synthetic identities.

## Data model

The additive migration `20261114105720_business_desk_foundation.sql` creates:

- Private role mappings, document sequences and full command audit history: `private.msbd_roles`, `private.msbd_sequences`, `private.msbd_audit`.
- Company profile and financial configuration: `public.msbd_settings`.
- Clients, private staff notes and reference service pricing: `msbd_clients`, `msbd_client_notes`, `msbd_services`.
- Versioned, numbered business documents: `msbd_documents`. Quotations, invoices, receipts, credit notes, account statements and service orders share an explicit typed document record and immutable issued snapshot.
- Evidence-based payments and actual refund/reversal records: `msbd_payments`, `msbd_reversals`.
- In-app events, email queue, editable templates and enquiry attachments: `msbd_events`, `msbd_email_jobs`, `msbd_templates`, `msbd_attachments`.
- Private Storage buckets: `business-documents`, `business-attachments`, `business-branding`.

All new public tables enable RLS and explicitly revoke default write grants. Read policies restrict staff scope or the linked client identity. Raw payment evidence, notes and administrative audit information are not available to portal clients. Private Storage has no public/client read policy; controlled routes verify record ownership before server downloads.

The verified designated owner automatically becomes Business Desk super admin. Academy instructor, editor, staff and ordinary website-admin roles do not automatically grant Business Desk permissions. New roles are owner-managed: administrator, sales, finance and management. Each server command checks the actual verified actor and the protected role record, independently of UI controls and user-editable metadata.

## Financial invariants

Prices are integer minor units, quantities are integer thousandths, and PostgreSQL numeric arithmetic calculates and rounds each line before applying item discounts, overall discount, configured tax, charges and delivery. Totals are independently calculated in the database; browser values are never authoritative. Currency is explicit and reports never combine currencies into one revenue total. Tax defaults to zero and requires company-authorised configuration. Sales discount limits are owner-controlled.

Document sequences are generated atomically by type and year. Issued numbers, content, dates, company/client snapshots and document hashes cannot be silently edited. Drafts require submission and approval before issue. Controlled quotation revisions preserve the original and mark it superseded. A quotation cannot produce duplicate invoices. Payment schedules must equal the document total; full payment, 70/30, 60/40, 50/50 and custom milestones are supported.

Payment entries begin pending. Only finance or the owner can confirm actual received funds with evidence and explicit reconciliation acknowledgement. Invoice locking prevents concurrent confirmations from overpaying the balance. Confirmation creates one immutable receipt for that payment, idempotently. Partial payments create separate receipts. A receipt is never created from an unverified payment. Overpayments are rejected for review rather than silently allocated.

Only the owner records actual full or partial refunds/reversals. This records a completed external transaction; it does not transfer money. Refunds alter the confirmed retained balance, preserve the original receipt PDF and update its public status. Owner-issued credit notes cannot exceed the unpaid invoice balance; actual refunds must be recorded before crediting previously paid amounts. Cancellation/write-off is restricted and audited.

## Documents, portal and verification

Issued PDFs preserve the company, client, pricing, terms, branding, signature and stamp snapshot. PDF bytes are saved privately on first generation, hashed and retained without overwrite. Subsequent downloads verify the saved byte hash. Draft PDFs are visibly watermarked. Font variants are derived from the existing OFL-licensed Manrope font; explicit currency codes avoid missing currency glyphs. Multi-page tables, totals, amount in words, signature area, QR code and page numbering were rendered and inspected with controlled test fixtures.

A client account is linked only after an authorised identity review and an exact verified email match. It is never linked automatically by signup metadata. Portal clients see their own issued documents and safe invoice balances. They cannot read finance evidence, other clients' records or private notes. Quotation acceptance requires an explicit action, authority confirmation, terms acknowledgement and a record bound to the issued version's hash. Opening a document does not accept it.

Public verification requires an unpredictable document token from the QR code, not a guessed sequential number. It returns only company name, document type/reference, issue date, masked client label and status. It exposes no totals, payment references, private database IDs, addresses, emails or attachments. Persistent rate limiting protects the lookup.

## Notifications and credentials

Existing website enquiries retain their references, spam controls, idempotency and outbox. New state, budget and contact-preference fields are saved as bounded enquiry details. Up to three PDF/PNG/JPEG attachments of 2 MiB each use a short-lived request-scoped write permit. Uploaded files are private and downloaded only by authorised staff. Do not treat file validation as antivirus scanning.

Business email uses the existing `RESEND_API_KEY`, `NOTIFICATION_FROM`, `NOTIFICATION_TO` and `RESEND_WEBHOOK_SECRET`. The existing `CRON_SECRET` protects the retry worker; `RATE_LIMIT_SALT` protects request permits and public verification. No new secret is exposed to the browser. No credentials were invented or retrieved from another project.

Automatic transactional notifications and scheduled reminders default off. The owner enables them and individual templates when the sender is operational. Explicit document-email actions queue the issued PDF. Jobs distinguish pending, processing, provider-accepted and webhook-confirmed delivery. Retry leases and idempotency keys prevent duplicate sends; jobs older than the provider idempotency window stop for review. In-app alerts, approvals, expiring quotations, invoice due reminders and unanswered-request follow-ups use existing company records.

Online Business Desk gateway charging is not enabled. Bank/cash/POS/gateway payments received outside the module can be recorded and reconciled using real evidence. The existing Academy gateway remains isolated. Do not represent manual payment recording as a bank transfer or a verified gateway webhook.

## Release gates and operational boundaries

1. Obtain explicit approval for the application-data backup and its private destination; create and verify the backup before structural production changes. Exclude passwords, API keys, Auth sessions and sign-in secrets. Retain the source commit and migration catalogue. An application-data export is not a provider-managed Auth/Storage point-in-time backup; document its restoration scope.
2. Recheck the exact Mega Stride target, apply the migration once, inspect grants/RLS/advisors, and run read-only hosted verification.
3. Deploy the reviewed source only after the database prerequisite is complete. Use the verified owner account to test staff navigation, portal linking and PDF access. Do not weaken authentication or enable an assumed identity to test it.
4. Use isolated test identities and transactions for permission and reconciliation tests. No real financial transaction or client email is authorised merely by the QA fixture.
5. Complete real sender/SMTP configuration, callback allowlists and controlled delivery tests. Provider credentials and public verification-email delivery are not yet operationally confirmed.
6. Complete authenticated browser and mobile checks against the new module after migration; these remain pending while deployment is blocked.

The directory paginates clients in groups of 25. Selection lists load up to 250 records and include a specifically selected client or invoice reached from paginated records. Search-as-you-type can be extended for substantially larger catalogues. Reports export up to 5,000 matching rows and explicitly flag truncation. Recurring invoice scheduling, multi-invoice payment allocations and expiring guest document-download links are not enabled; each payment is tied to one invoice and clients use verified portal access.

## Validation completed before review

- 23 application/security tests and 102 isolated PostgreSQL checks pass. Business commands and private identity lookups are exercised under the real service_role with no SELECT grant on auth.users.
- Permission cases include owner-only role grants, staff directory scope, assigned sales records, management draft exclusion, client isolation, exact verified email linking and removal of stale portal links after an email change.
- Financial cases cover exact totals, approval, immutable snapshots, duplicate-safe conversion, pending vs confirmed receipts, overpayment rejection, credits and full/partial refunds. Email cases cover default-off notifications, idempotency, exclusive leases and terminal bounce events.
- TypeScript and the production build pass. Multi-page PDF fixture output was rendered and inspected. Authenticated hosted Business Desk browser checks remain pending until the backup, migration and deployment gates are completed.
- React review: server actions authenticate independently; request identity is cached only within the render request; heavy PDF generation stays server-only; invoice balance requests run in parallel; editable fields are labelled and mutation errors provide retry guidance.
