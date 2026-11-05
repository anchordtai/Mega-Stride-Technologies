# Mega Stride architecture and operations

## Application and data boundaries

Next.js handles public corporate pages, authenticated learning/staff pages, server actions and route handlers. Supabase is a dedicated external service, not an extension of the church, POS or nightlife applications. Public publishing uses RLS; identity is verified using Auth `getUser`; privileges come from the protected `private.staff_roles` table. Editable user metadata and the legacy admin cookie never confer access.

| Role | Access |
|---|---|
| Public visitor | Published content/courses; validated server enquiry endpoint |
| Learner | Own enrolment and progress; published lessons/resources for active/completed enrolments |
| Staff | Enquiries, internal notes, enrolments, quotation drafts and reports |
| Editor | Publication content/revisions and preview; no private enquiries |
| Instructor | Course/lesson/resource management and teaching records |
| Admin | All staff workflows, quote approval and content/Academy management |
| Service identity | Server intake and email queue only in application code; key never returned to a visitor |

Public tables: profiles, content, content_revisions, enquiries, enquiry_notes, courses, enrolments, lessons, lesson_progress, resources, quotations, transactions, audit_logs, notification_outbox. RLS is enabled on each. Private tables: staff_roles and rate_limits. Foreign keys, bounded fields, indexed relations and allowed status constraints are in migrations. Delete privileges are not granted for operational records; use archive/cancel statuses.

Private `academy-resources` bucket: PDF restriction and 10 MiB bucket cap; the upload action uses the tighter 3 MiB limit to fit server request constraints. Resource downloads require a verified session, permitted resource record and 60-second signed URL. Keys use random names. Service-key links are never exposed. Only trusted teaching/admin users can upload. Add malware scanning before broader upload permission is offered.

## API and action map

| Interface | Purpose | Access / result |
|---|---|---|
| `POST /api/enquiries` | Contact/trade/quotation/training intake | Matching Origin, JSON ≤20,000 bytes, field validation, consent, honeypot; production Turnstile and rate salt required; 201 + stored reference or explicit 4xx/503 |
| `GET /account/confirm` | PKCE or verified email token exchange | Safe fixed internal continuation, error redirect; no arbitrary redirect target |
| Account server actions | Sign in/up/out and password recovery/update | Supabase Auth; 12–128-character passwords, generic responses; production Auth rate limits/SMTP must be configured |
| `/admin` server actions | CRM, content, Academy and quotes | Server-verified roles plus database RLS; no privileged client mutations |
| `GET /api/resources/:id` | Private PDF download | Verified user and RLS; 60-second signed URL; no-store |
| `GET /api/admin/export` | Enquiry CSV | Staff/admin; latest 1,000, formula-prefix escaping; no-store |
| `GET /api/admin/quotes/:id` | Quote PDF | Staff/admin, recomputed totals, draft marking; no-store |
| `POST /api/internal/notifications` | Retry queued staff notifications | Constant-time CRON_SECRET bearer check; no public scheduler configured |

Quote PDF currently uses standard PDF fonts and replaces unsupported characters; international Unicode font embedding and full long-text pagination are pending polish. Staff quotation inputs currently use a structured JSON item editor; a business-friendly line-item editor is outstanding.

Intake → SQL `submit_enquiry` creates enquiry and outbox in one transaction. SQL rate limit is five attempts per hashed edge IP per hour; IP salt must be generated independently. Vercel edge headers are the production trust boundary; review before deploying elsewhere. Failed submissions never claim success. Contacting via email/telephone remains possible when online intake is inactive.

Email delivery is an optional Resend adapter, not an activated external account. Notifications contain an enquiry reference rather than customer details. A SQL lease prevents concurrent claims; retries use a stable idempotency key and cap at five attempts. Provider idempotency retention is finite: production retry scheduling must stay within the provider window and handle ambiguous acknowledgement failures before retrying expired keys. `after()` performs a best-effort attempt after intake; a separately configured authenticated worker is required for guaranteed later retries. Sent means provider acceptance, not confirmed mailbox delivery; delivery/bounce webhooks are still required.

## Configuration

Copy `.env.example` locally and populate only from a verified new Mega Stride project. Keep the resulting file ignored. No key values are included in docs or source.

| Name | Use |
|---|---|
| MEGA_STRIDE_SUPABASE_PROJECT_REF | Explicitly pinned new project ref; known unrelated refs rejected |
| SUPABASE_URL | Must equal the exact pinned project HTTPS URL |
| SUPABASE_PUBLISHABLE_KEY | New project publishable key for user/RLS access; legacy/secret key rejected |
| SUPABASE_SERVICE_ROLE_KEY | Dedicated server secret (new secret key or compatible service role); intake/worker only |
| DATABASE_URL | Dedicated migration/backup connection; never a browser variable |
| SITE_URL | Exact origin for the environment; never copy production into a preview unintentionally |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY | New/approved anti-abuse widget and server verification |
| RATE_LIMIT_SALT | Independent random server secret for hashed addresses |
| RESEND_API_KEY / NOTIFICATION_FROM / NOTIFICATION_TO | Approved verified notification sender/recipient; inactive until configured |
| CRON_SECRET | Private retry-worker bearer secret; do not put in query strings |

Only the Turnstile site key is intentionally prefixed NEXT_PUBLIC. Set environment values through the deployment secret interface. Do not use a public variable for a privileged key. Configure the Auth Site URL and exact callback URLs separately for staging/production; no broad production wildcard. Require email confirmation and suitable recovery SMTP. Bootstrap the first administrator by inserting a verified Auth user ID into private.staff_roles using trusted SQL administration. Do not grant users permission to create staff roles.

The CLI is deliberately pinned to 2.81.3; the November 2026 v3 local-default/hosted-confirmation breaking change was reviewed. Do not silently upgrade operational commands. The local tests do not need Docker or CLI linking.

## New project setup — no existing database fallback

1. Resolve the free-project quota or obtain approval for a priced project. Create **Mega Stride Technologies Limited** in the owner's selected **Anchord Taiwo** organisation. Suggested region: eu-west-1, subject to approved residency/latency needs.
2. Verify returned project ID/status and that it is new/empty. Record ownership and project ref in the deployment runbook. Existing application projects are not candidates for linking.
3. Use the new project's SQL editor or approved migration tooling to apply both committed migrations in order. If using pinned CLI: inspect `supabase link --help`, explicitly link the new ref, inspect `supabase db push --linked --dry-run`, then apply only after confirming the destination. No project is currently linked in this checkout.
4. Confirm RLS and grants, run hosted security/performance advisors, and perform real anon/learner/staff negative tests. Confirm the private schema is not in exposed schemas.
5. Configure dedicated Auth, storage, keys, CAPTCHA, SMTP and approved staff identities. Test account creation/recovery, learner isolation, signed URLs and persisted enquiries through real APIs.
6. Provision an independent staging database for realistic release tests when available. Never use another business application's project for staging.

## Backup, recovery and migration plan (proposed, not enabled)

Target plan for owner approval: encrypted daily database and private-object backup, 30-day rolling retention, separate restricted off-provider location, restore rehearsal before first release and after material schema changes. Business-defined RPO/RTO and legal retention must be approved. Free-tier platform backup availability is not assumed. Database dumps do not include stored object bytes.

Before each schema change: confirm project identity, record applied migrations, take a verified backup of required application/Auth/Storage metadata and object files, preserve secret configuration separately, run new migrations on isolated staging, and test rollback/forward-fix. Use the pinned CLI's `db dump --help` to select schema/data/role exports; the available `--linked` and `--file` flags avoid embedding a password in command arguments. Save backups outside the repository with restrictive access. Do not commit Auth records or dumps.

Restore rehearsal: create an empty **Mega Stride-only recovery project**, reproduce required Auth/Storage setup using supported provider procedures, restore application schema/data and object bytes, verify record counts/relations and object checksums, run RLS and real-account negative tests, verify notifications are disabled during restoration, then record the recovery duration and results. Never overwrite the sole live database to test restoration. The current automated restore uses PGlite only and does not replace this hosted rehearsal.

Production rollback: record the exact current Vercel deployment ID, Git SHA, environment/configuration inventory and custom-domain mapping first. Preserve the previous deployment. Prefer additive schema changes; application rollback is safe only while database compatibility remains. For incompatible writes, stop further writes and use the approved forward-fix or restore plan. Get owner approval before switching production/domain or destructive changes.

## Release gate

Do not deploy this foundation as a finished system. See IMPLEMENTATION-STATUS.md for missing modules and checks. Require a new dedicated healthy project, hosted security tests and restore, approved content/contact details/legal policies, compatible browser/device QA, verified notification delivery, and explicit production approval. Payment activation requires separate provider/settlement approval and sandbox end-to-end verification.

## Sources consulted

- Supabase changelog: https://supabase.com/changelog.md (including CLI v3 breaking change).
- SSR clients and session refresh: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Private storage: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Resend sending API: https://resend.com/docs/api-reference/emails/send-email
- NDPC privacy-rights guidance (for draft review only): https://erp.ndpc.gov.ng/privacy_policies
- Next.js 16.4.5 installed documentation for server-action body limits and proxy conventions.
