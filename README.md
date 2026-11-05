# Mega Stride Technologies Limited

Academy, payment and email functionality: [implementation, verification and account activation requirements](docs/ACADEMY-COMMERCE-2026-11-05.md).

Premium public-site redesign deployed 5 November 2026. See [redesign release evidence and remaining work](docs/REDESIGN-2026-11-05.md). PR #4 remains open; production currently serves its verified commit.

Live corporate website: https://www.megastride.com.ng/ . The existing Next.js application now uses the dedicated free Supabase project `okknsxrhbiiunjlaitcy` for protected enquiries and platform foundations. The corporate release is deployed; the wider Academy, payments and email roadmap remains incomplete. See [release evidence and limits](docs/RELEASE-2026-11-05.md). No other application's database is reused.

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

The database suite runs an isolated PGlite PostgreSQL instance with explicit Auth/Storage contract stubs. It never connects to a hosted project and creates only synthetic test records. Hosted Auth/Storage APIs, real notifications, sandbox payments, physical-device QA and hosted restoration remain gates for those additional capabilities.

## Production

Production configuration uses Vercel Secret values for the server key and request-signing salt. Public learner signup, live payments and automatic email delivery are held. The old unsigned admin cookie is not accepted. Preserve the rollback deployment and never replace the dedicated database with another project. See the release document and architecture runbook before future changes.
