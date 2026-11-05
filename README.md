# Mega Stride Technologies Limited

Existing Next.js corporate website, extended on an isolated development branch with dedicated Supabase architecture, enquiry/CRM, publishing and Academy foundations. **Not deployed or production-complete.** The new Supabase project is blocked by the account's active-free-project quota. No existing application database is reused.

Start with:

- [Existing website audit and roadmap](docs/AUDIT-2026-11-05.md)
- [Implementation status, test evidence and outstanding work](docs/IMPLEMENTATION-STATUS.md)
- [Architecture, API, configuration, backup and rollback runbook](docs/ARCHITECTURE-AND-OPERATIONS.md)

## Development

Use Node 24 (at least Node 22), then `npm ci`. Copy `.env.example` to an ignored local environment file. Do not add another application's Supabase keys. With no database configured, corporate pages remain available and online forms/accounts fail closed with contact alternatives.

```sh
npm run dev
npm run typecheck
npm test
npm run test:database
npm run build
```

The database suite runs an isolated PGlite PostgreSQL instance with explicit Auth/Storage contract stubs. It never connects to a hosted project and creates only synthetic test records. Hosted Auth/Storage APIs, real notifications, sandbox payments, device/browser QA and hosted restoration remain release gates.

## Production

Keep the PR in draft until the runbook's release gates are met. Confirm the correct hosting project/domain, new independent database, authorised content, secrets, backups and rollback before owner-approved deployment. No live payment provider is enabled. The old unsigned admin cookie is not accepted.
