# Proposed protected migration rollback snapshot

Status: prepared and tested locally; production execution was rejected by automatic approval review pending explicit owner approval. No production copies or Business Desk tables were created by this attempt.

The quotation workflow is already implemented in draft PR #14. It supports client records, normal line-item prices, approval and branded quotation PDFs. Releasing it still requires an appropriate pre-migration rollback safeguard.

The proposed safeguard retains copies of the current 33 public/private application tables (approximately 3.1 MiB of relations at inspection) and their DDL metadata in a new, non-exposed `msbd_rollback_20261116` schema inside the existing Mega Stride Supabase project. Sensitive client, account/profile, payment, course and assessment records therefore remain with the existing database provider. No application rows are returned through the connector or uploaded to ChatGPT files or GitHub.

The application roles `anon`, `authenticated` and `service_role` receive neither schema access nor table access. Every retained table has RLS enabled. The database owner remains able to inspect and restore the copies. This is an additional sensitive-data copy and needs owner approval.

A bounded write lock produces consistent copies. Counts and full-row digests are compared before committing; each retained row set is also restored to a disposable temporary relation and its digest checked. Only verification metadata is reported. Any failure aborts the operation. The local suite includes denied-role access and independent-snapshot checks.

Scope excludes Auth passwords, Auth sessions, API keys and Storage object bytes. Existing managed Auth accounts and Storage files are not changed. These same-database copies support migration rollback; they do not protect against project loss, account compromise or provider failure and are not an off-site backup or managed point-in-time recovery service.

Production sequence after approval:

1. Recheck the dedicated project, migration state and available space.
2. Apply the protected rollback-snapshot migration and verify counts, digests and grants.
3. Apply the Business Desk migration; inspect RLS/grants and run metadata-only hosted checks.
4. Merge/deploy the tested implementation and complete authenticated desktop/mobile quotation/PDF checks using authorised identities and genuine client details.

Client names, recipient addresses, scope, quantities, prices, validity and payment terms must be provided by the owner before preparing or emailing a real quotation. No client data or financial terms will be invented.
