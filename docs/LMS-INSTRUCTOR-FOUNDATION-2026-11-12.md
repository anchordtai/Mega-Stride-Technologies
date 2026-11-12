# Instructor-ready LMS · Batch 1 · 12 November 2026

This batch addresses the new Academy specification systematically. It is not the complete five-course LMS/content release. The separate protected academic content package and its completion register identify authored drafts and remaining work. No course is ready for public sale.

## Implemented

- Five genuine course definitions at the owner-requested fee of NGN 1,500,000 minor units (₦15,000), all draft. Database constraints prevent missing/wrong course fees and require academic approval before publication.
- Assigned-course instructor authorization replaces global instructor access. Financial records, security/roles and certificate overrides remain outside instructor permissions. Existing server-side assessment administration additionally verifies assignment before using the trusted service client.
- Paid learning access requires active/completed enrolment plus course-specific verified live Paystack payment, zero-fee eligibility for other courses, or an explicitly audited administrator exception. Test transactions and forged active enrolments do not unlock lessons. No test-payment access bypass is introduced.
- Module records, separate student/instructor academic documents, review states and versions. Answer-key documents are always instructor-only; private assessment keys remain outside the exposed schema. Documents are editable through /instructor without code changes. Markdown rendering escapes raw HTML and applies the renderer's safe URL transformation.
- Practical tasks and text evidence submissions, five submissions per version, assigned-instructor grading and feedback, grade auditing, no self-grading and no client mark updates. Private uploads/video approval, malware scanning and richer evidence types remain pending.
- Module-aware learner navigation, lesson progress and explicit save/resume position; no fabricated time-spent analytics. Learner and instructor operations require confirmed email identities.
- Certificate eligibility now also checks paid access, configured module readiness and passing required practical/project submissions for the five Academy courses. Existing final-assessment and lesson completion checks are retained.
- Certificate PDF has a real QR code to its public verification URL, institution wordmark/arrow, unique code, holder/course/date, CEO name/designation and explicit unsigned-record label. No authentic signature is fabricated. Public verification supports number entry and valid/revoked/expired state. A new certificate request discloses that holder name/course/date/status are publicly verifiable by the opaque code.

## Academic content

The separate restricted package contains Cloud Modules 1 and 2: substantive student lectures, instructor delivery guides, two labs, separate marking guides and twenty varied revision questions with protected solutions/rubrics. The capstone is a draft blueprint. Student versions exclude answers and instructor marking schemes. No instructional content or answer keys are committed to this public source repository. Draft copies can be imported into the protected database with approval still pending.

## Validation and limits

20 existing application/security checks and 65 isolated PostgreSQL checks passed before release packaging. New database checks cover unpaid/test/cross-course access, scoped instructors, answer protection, grade forgery, assigned grading, resume validation, required practical/project completion, refund access removal and administrator-only audited exceptions. TypeScript/production build passed; final checks are recorded in the PR. A synthetic certificate PDF was rendered and visually inspected; its QR was decoded from the rendered page to the exact verification URL. No real certificate/user/payment was issued.

There are no genuine application users yet; authenticated browser, real SMTP/Resend delivery and Paystack sandbox calls require owner/provider setup. Timed/randomized exams, AI tutor/provider limits and cost controls, richer learning analytics, approved media, consent-aware automatic certificate issuance, complete five-course content, physical-device verification and classroom/VM lab execution remain incomplete. Do not enable public signup or live charging as a result of this batch. Do not bootstrap a privileged identity from a guessed email.

No paid infrastructure upgrade or unrelated application/database changes. No course materials are publicly released by the draft import. An application rollback preserves additive tables/documents and course records; retain the tightened access controls. Do not revert to global instructor access or treat manual enrolment as payment verification.

## Database approval and verification

The owner explicitly approved the database changes on 12 November 2026. Hosted migrations `20261112104410_instructor_ready_lms` and `20261112104524_private_learning_access_helper` applied successfully; local filenames match hosted history. The second migration keeps the authenticated ownership check in the unexposed private schema behind a public SECURITY INVOKER wrapper, resolving the security advisor warning without widening access.

The protected draft import created two Cloud modules, two unpublished lessons and eleven draft academic documents, including five instructor documents and three answer-key documents. All five courses remain draft at 1,500,000 NGN minor units each (₦15,000); no lesson is published and no academic document is approved. No genuine application user, payment or certificate was created.

Hosted privileges confirm no anonymous academic-document access, no authenticated grade/override RPC execution and no client submission mark updates. Every public table has RLS. A rolled-back authenticated learner query returned zero courses, documents and lessons and false paid access. Final security advisors report no ERROR/WARN; INFO findings are intentional deny-by-default backend tables. Performance advisors show unused-index INFO only in the largely empty platform. See [RLS advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

The application source remains in draft PR #7 and has not been merged or deployed. Database approval completes the schema/import step, not the wider academic content, AI, examination or provider activation work. Verify deployment and real-account workflows before describing this new LMS interface as live.

## Deployment checkpoint · 12 November 2026

PR #7 has since been merged and deployed to the live production domains. PR #8 adds the owner-supplied official company logo, favicon/Apple icon and certificate PDF branding. Production deployment dpl_C8nLNBzxxebUovSkKX9AXTWcZB51 is READY at commit 6a212da948f055f20d9e55b8d65c763183add7be, with www.megastride.com.ng assigned. The live certificate lookup page and its new header logo were observed in the browser.

The academic package and protected draft import have been extended to Cloud Module 3. Its local Python network evidence lab, deliberate HTTP-path failure and restored baseline were executed; VM/provider/classroom tests are not implied. The latest content register supersedes earlier two-module counts. All five courses remain unpublished drafts. No provider has been activated, no real certificate issued and no role granted to an assumed account.


## Current content publication · 12 November 2026

Supersedes earlier course-content draft counts: all five course packages are authored and published in the protected LMS at ₦15,000 each. Totals: 36 modules/lessons, 41 required graded tasks (five written final assessments and five projects included), five objective final assessments, 191 academic documents and 137 separate academic-bank items. The complete import/publication was replayed in isolated PostgreSQL; hosted unpaid-role checks found five visible public course records and zero visible lessons/modules/documents/tasks. No instructor solution is added to this public repository. See the current ACADEMY-CONTENT-REGISTER-2026-11-12.md for exact validation and execution limitations.

Phone changed to +2347075721887 across company configuration, display text, call links, quotation PDF contact line and organization metadata. Catalogue cards now show the fee and course pages explicitly state when online payment is unavailable. Paystack credentials are absent; online charging and public signup remain closed. No paid plan, real transaction, email or assumed administrator identity was created. The AI tutor and advanced timed/randomized exam roadmap are separate from the published teaching materials.
