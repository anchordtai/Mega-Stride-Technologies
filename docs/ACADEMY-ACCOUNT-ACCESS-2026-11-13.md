# Academy owner, signup and role management · 13 November 2026

The owner explicitly selected their super-admin email. Its allowlist entry is configured in the private database, separately from the public migration source. This release does not create a password, confirm an email, grant an assumed identity access or record a payment.

## Account flow

- `/account/signup`: full name, email, password of 12–128 characters, student or instructor-application purpose, terms and privacy acknowledgement.
- `/account`: sign in and password recovery. Verification/confirmation uses `/account/confirm`.
- Verified owner → `/super-admin`; approved instructor → `/instructor`; other staff → `/admin`; student → `/academy/dashboard`.
- Signup metadata supplies display text and application intent only. It cannot grant an elevated role. Instructor requests start pending; staff permissions require owner approval and verified email.

## Owner controls

The protected super-admin dashboard lists/searches/paginates accounts and their assigned roles, pending instructor requests, courses, teaching assignments and recent administration history. It can approve verified instructors, change ordinary staff/student roles, assign teaching courses and manage enrolment status. The owner role is protected from demotion in these controls.

Privileged RPCs are service-only, validate a verified designated owner actor, and retain reasons in a private audit table. The public self-status RPC reveals only whether the current authenticated user is the owner. Public clients cannot read the owner allowlist, audit table or other users' authentication records.

“Enable my course test access” creates active own enrolments and audited learning exceptions for published Academy courses. It creates no payment, receipt or grade. Revoking the exceptions preserves any legitimate verified-payment access. A normal active enrolment still cannot bypass paid-course authorization.

## Activation and verification state

Owner bootstrap is initially disabled. Project Auth settings must be checked before enabling it. A read-only request to the dedicated project's public Auth settings on 13 November confirmed email/password enabled, signup enabled at Auth level, and email auto-confirmation **false**. Email delivery and allowed callback URLs still need operational verification. Supabase dashboard sign-in reached a CAPTCHA; no CAPTCHA was solved and no confirmation-email protection was disabled.

The application signup flag remains off pending final authentication setup. General learner signup must not be described as operational until delivery and the complete verification/login flow have been observed. The owner must enter their own password and accept the applicable signup terms. No password or verification code should be provided in chat.

Validation: 20 application/security tests and 77 isolated PostgreSQL checks pass, including unverified-owner rejection, disabled bootstrap, metadata self-promotion rejection, owner identity protection, pending-only applications, scoped course assignments, and owner test-access grant/revocation without transactions. TypeScript and production build pass. Authenticated browser workflows still require the actual verified account.

## Owner's testing sequence after activation

1. Create the account with the designated owner email and a personally chosen password.
2. Verify the confirmation email, then sign in. The designated verified identity receives the owner role and reaches `/super-admin`.
3. Enable own course test access and open the student workspace.
4. Open a course, resume lessons, submit a practical and take its current objective assessment.
5. Create a separate verified student account to check restricted access; apply as an instructor, then approve/assign it through the owner dashboard to test course-scoped teaching and grading.
6. Revoke testing exceptions when finished. Actual payments stay disabled until the company gateway is securely configured and verified.

Database migration applied to the dedicated Mega Stride project as `20261113132449_academy_owner_and_member_management`. Hosted verification: zero accounts/claimed owners, bootstrap disabled, service schema access available, no authenticated role-change RPC execution and no anonymous owner-claim execution. Security advisors report no ERROR/WARN; INFO-only deny-by-default private tables are intentional.
