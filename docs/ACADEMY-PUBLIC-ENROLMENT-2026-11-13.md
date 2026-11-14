# Public Academy registration and course sharing · 13 November 2026

The owner explicitly approved opening public student signup and instructor applications. Production `ACADEMY_PUBLIC_SIGNUP_ENABLED` is now true. Instructor applications remain pending until a verified owner assigns teaching permissions; signup cannot grant administrative roles.

## Student journey

1. Choose a course or create an account at `/account/signup`.
2. Verify the account email, then sign in at `/account`. Verification ends at signin so the learner explicitly starts their session.
3. Register for a published course at `/academy/register?course=<slug>` and acknowledge the Academy terms. A paid registration is pending; registration does not charge, create a transaction, or unlock lessons.
4. When live Paystack is configured, pay the canonical course fee through the registered course page. The application requires a pending own registration before checkout. The dashboard links back to finish payment.
5. The callback checks the payment with Paystack. Only matched live settlement unlocks the associated course; a successful verification opens its learning page. Test charges never grant access. A learner can retry verification with their own reference without paying again.

Free published courses use the verified registration action and existing free-enrolment routine. Cancelled registrations require staff review and cannot be reset by registering again. Registrations are unique and idempotent.

The selected public course survives signup, verification and signin through a small allowlist of Academy destinations. External URLs, arbitrary query strings, admin routes and private lessons cannot be injected as authentication return destinations. Custom SMTP and allowed email callback URLs must support the production flow.

## Sharing

Course catalogue cards, course detail pages, registration pages and learner course cards offer WhatsApp, Facebook, LinkedIn, X, copy-link and native sharing. Shares contain only the public course title and canonical public course URL. Account identities, payment references, private lesson URLs, documents, answers and progress are never included. No social posts are sent automatically.

Training enquiries remain available at `/academy/enquire`, separate from actual registration.

## Service activation limits

At inspection the project has no `PAYSTACK_SECRET_KEY`; payments remain configured as test with live approval false. No payment key was retrieved or invented, and no payment mode or financial protection was weakened. Paid registrations can be saved, but the UI clearly states payment awaits activation. The owner must securely configure the company's live Paystack credential and webhook before a real payment and settlement test.

Public email delivery and callback settings require signed-in Supabase Auth configuration. A team-member account verifying successfully does not prove that arbitrary public learner addresses can receive mail. Default Supabase SMTP restricts recipients; custom SMTP must be verified for public use. No email confirmation was bypassed.

## Validation

21 application/security tests and 82 isolated PostgreSQL checks pass, including registration identity/privilege restrictions, unpublished course rejection, idempotency, unpaid access denial, free access, cancelled-registration protection and the test/live settlement distinction. Production build and TypeScript pass. The repository has no ESLint flat configuration, so its standalone lint command cannot run as configured.

Migration `20261113135816_academy_course_registration` is applied only to the dedicated Mega Stride project. Hosted checks confirm service-only RPC execution. Security advisors show no ERROR/WARN, only existing intentional deny-by-default backend tables. Browser verification and external-provider activation results should be recorded at release.
