# Mega Stride development handover — 5 November 2026

This is a **development foundation**, not a completed production transformation. The live website has not been replaced, and no existing database has been modified.

## What changed

| Area | Before | Development branch |
|---|---|---|
| Architecture | Unpinned packages, no database/API | Retained Next.js/React/TypeScript/Tailwind; exact packages and lockfile; dedicated-database configuration checks |
| Corporate pages | Short disconnected About/Services; homepage-only trade | Shared navigation; About; seven linked service detail pages; Trade; quotation and contact intake |
| Branding | Blank corrupt logo and two missing hero JPEGs | Honest text wordmark, original assets retained; existing SVG illustrations replace missing hero images; navy/blue/white/gold navigation |
| Navigation/accessibility | Tablet breakpoint gap; tiny carousel indicators | Consistent desktop/mobile breakpoint, Escape support, skip link, visible focus, user-controlled slideshow and reduced-motion handling |
| Enquiries | Visitor email client only | Validated server endpoint, same-origin and stream-size checks, honeypot, production Turnstile gate, atomic enquiry/outbox insertion and durable rate limit |
| CRM | Absent | Role-controlled staff page, status/assignment/follow-up/notes, search/filter and CSV export |
| Academy | Local browser data and simulated progress | Account/signup/recovery code, protected enrolments, course/lesson records, acknowledgement-based completion and private PDFs |
| Publishing | Source editing only | Draft/preview/publish/archive for posts and projects; revision snapshots and audit trail; other content kinds stored for later page composition |
| Quotations | Absent | Draft quotation records, server-calculated minor-unit totals, administrator approval and downloadable PDF |
| Notifications | Absent | Durable outbox and retry/lease mechanism with a configurable Resend adapter; no email provider activated or message sent |
| SEO | Relative sitemap, shared metadata | Absolute sitemap/robots references; page canonicals and metadata; Organization/Service/Course data |
| Security | Fixed unsigned admin cookie | Legacy cookie ignored; verified identity plus database-owned staff roles and RLS; no client permission to verify payments |
| Legal notices | Absent | Clearly labelled privacy, website and Academy terms drafts requiring approval |

The exact street number, secondary telephone/WhatsApp number and intact official logo require management confirmation. The development site uses city-level location and the existing primary telephone. Original files remain in Git history and in the checkout. No fake clients, testimonials, history, accreditations, pricing, course dates or project results were introduced. No existing browser-local data was deleted or migrated; those old prototype records are not proof of real enrolment/payment.

## Current verification

| Check | Result and limit |
|---|---|
| Production build | Passed on the development source; no production deployment performed |
| Type checking | Passed with the production build; separate final check recorded in Git/PR validation |
| API/configuration/security/quotation tests | 10 passed; includes negative API responses and no false success when unconfigured |
| Isolated PostgreSQL checks | 22 passed in PGlite with explicit Supabase Auth/Storage schema stubs |
| Schema and RLS | Clean install, public/private boundaries, self-enrolment denial, completion ownership, storage visibility, staff role checks, enquiry/outbox atomicity, rate limit and queue lease tests passed locally |
| Restore | Local PGlite snapshot restored into a separate instance and records checked; **not** a hosted Supabase backup/restore test |
| Built HTML inspection | 18 rendered pages checked for local routes, image paths, anchor targets and one H1; four unauthenticated redirect documents excluded. All 19 sitemap URLs are absolute. This is source/build inspection, not visual browser QA. |
| Production dependency audit | `npm audit --omit=dev --audit-level=high` returned zero vulnerabilities at inspection time |
| Live baseline | Browser inspected all eight existing application pages, validated empty contact input and confirmed simulated progress increments |
| Changed UI/mobile/tablet | **Not verified**: managed preview launched `next dev --host ... --strictPort`; Next.js rejected these unsupported arguments. No separate preview infrastructure or browser workaround was installed. Requires a compatible preview environment before release. |
| Hosted database verification | Dedicated project verified healthy; 14 public application tables and 2 private tables have RLS. Atomic enquiry/outbox and anonymous/learner isolation passed in rolled-back hosted tests. No synthetic rows retained. |
| Hosted authentication/storage/email/payments | Auth signup/recovery, file transfer, email delivery and payments remain unverified; server credentials and approved provider setup are pending. |
| Core Web Vitals, physical devices, full WCAG review | **Not performed**; no numerical score or certification claimed |

## Dedicated database provisioned — update 5 November 2026

The initial project-creation quota blocker was resolved by the owner creating a new project and adding its account connection. Verified project: **mega stride database**, ref `okknsxrhbiiunjlaitcy`, organisation `ovyznglccnmnkiejqpkj`, region `eu-west-1`, status ACTIVE_HEALTHY, Postgres 17.11.0.011. Its dashboard is https://supabase.com/dashboard/project/okknsxrhbiiunjlaitcy . No paid plan change was made.

Before schema setup the project had zero application tables, zero Auth users and zero buckets. The foundation, notification delivery and advisor improvements migrations were applied to this project only. Local migration filenames now match the hosted migration versions to prevent duplicate application in later CLI workflows.

Verified: 14 public application tables plus 2 private tables, all protected by RLS; private `academy-resources` PDF bucket; service-only intake RPC; denied anonymous enquiry access and client staff-role creation. Hosted enquiry/outbox atomicity and anonymous/learner publication isolation passed using temporary transactions that were rolled back. No test enquiries, content or audit rows remained. Local tests now total **34 passed** (11 API/configuration + 23 PostgreSQL), including the additional migration.

Advisor improvements added four foreign-key indexes and replaced overlapping SELECT policies without expanding access. Remaining advisor INFO notices are intentional deny-by-default backend tables ([RLS without a client policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)) and indexes not yet used on a new empty database ([unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)). No ERROR or WARN findings remained after these changes.

The source configuration is pinned to the verified new project. Direct HTTPS Data API checks returned 200 for published content/courses and 401 permission denied for private enquiries. Intake activation is separately gated on server and production security credentials. Website environment credentials have **not** been installed in hosting and the production website has not been redeployed. The database is prepared; live website integration, real Auth/Storage flows and release gates remain outstanding. No other application's database was changed.

## Remaining work and business inputs

1. Configure website server credentials for the verified independent project, authentication, real identities and private storage; verify every permitted and denied flow through real APIs. Database provisioning/migrations and database-level checks are complete.
2. Confirm exact production hosting project/custom-domain ownership and Git integration. The connected Vercel project's returned domains did not include megastride.com.ng. Do not infer control or deploy over production.
3. Confirm official address, complete WhatsApp number, original logo, authorised staff and course/instructor information. Add only approved genuine portfolio/media/management content.
4. Confirm payment provider, settlement account, course pricing and refund policy. Payment initialisation, verified signed webhooks, idempotent settlement/enrolment, receipts and refunds remain **unimplemented**. The transaction table alone is not a payment integration.
5. Approve and verify an email sender/provider and authenticate delivery. Staff enquiry notifications have an adapter; quotation emailing, learner notifications, delivery webhooks and guaranteed scheduled retries remain pending.
6. Complete the Academy beyond the foundation: instructor profiles/assignment screens, course and lesson editing UI, assessment/exam authoring and results, certificate issue/verification, support tickets and payment history UI. No assessment/certificate records are fabricated.
7. Complete CMS page composition for homepage/About/services/contact/settings/FAQs/team/testimonials, media library, SEO field editing, role administration UI and audit viewer. Posts/projects currently have complete publication routes; other content types are database foundations only.
8. Finish RFQ supporting-document intake and malware-scanned uploads, customer quotation delivery/acceptance and revision management. Private Academy PDFs currently permit trusted admin/instructor uploads only; MIME and PDF-header checks are not malware scanning.
9. Improve responsive images/font delivery; measure performance/accessibility; run browser/device, content and link QA on the changed source. Carousel stock imagery is illustrative, not company project photography.
10. Approve legal/privacy notices, lawful bases, retention, international transfer arrangements and refund terms; implement approved request/retention operations before collecting live data.
11. Execute a hosted database + storage restoration rehearsal, production rollback rehearsal, environment-isolation check and owner-approved deployment.

## Production protection

Baseline: `4ef866162bb2579661a01a14f8b21f8e5887564f`. Development branch: `feat/mega-stride-platform`. The audit was committed before application changes. Keep the PR in draft; do not merge or promote to production until release gates are met. No live credentials, payment account details or personal customer records belong in this repository.
