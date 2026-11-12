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
