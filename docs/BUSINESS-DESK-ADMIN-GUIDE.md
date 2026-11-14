# Business Desk administrator setup

This guide applies after the approved migration and deployment. The implementation branch is not currently a live Business Desk release.

1. Sign in with the verified designated owner account. Open **Business Desk** from the super-admin dashboard.
2. Open **Settings**. Confirm the registered company name, address, phone, email, RC number, payment instructions and bank details. No bank account or tax identity is invented. Enter tax only after authorised company review; the default is zero.
3. Upload the approved logo, signature or stamp one asset at a time, using PNG/JPEG up to 2 MiB. Existing issued documents keep their original assets and information.
4. Decide whether every document requires owner approval. Configure the maximum sales discount. By default, owner approval is required and sales discounts are not permitted.
5. Assign Business Desk roles only to verified staff accounts. Sales prepares assigned-client quotations; administrators manage clients and documents; finance records/reconciles actual funds; management is read-only. The designated owner is protected.
6. Enter the service catalogue. Reference prices are optional; custom quotation lines remain available. Changing document currency does not convert entered prices.
7. Create or review client records. Search before adding duplicates. Assign the responsible salesperson. Keep internal notes in **Private client notes**, not in client-facing profile fields.
8. For portal access, verify the person and their authority to act for the client. The account email must match the client record. Use **Link matching verified account**; unlinked accounts gain no document access.
9. Complete sender credentials and controlled email tests. Only then enable automatic transactional notifications and reminders. Review templates and delivery logs. Queued or provider-accepted mail is not automatically delivered mail.
10. Review the protected audit history. Use controlled revisions, credit notes, cancellation and actual refund records for corrections. Never silently replace an issued document or use a fabricated payment to test production.

For testing, use the isolated database suite first. Real production account creation, payment confirmations, portal grants and client communications require the actual authorised identities and evidence. The company Paystack live key and public Auth email delivery are separate activation work.
