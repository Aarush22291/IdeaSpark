# IdeaSpark database

The canonical application database is Neon PostgreSQL with Drizzle ORM.

## Structure

The schema is defined in `src/db/schema.ts`. The event model is centered on teams and members, with submissions, payments, attendance, evaluation rounds, scores, admins, event configuration, departments, announcements and audit logs.

## Environment

Copy `.env.example` to `.env` and set `DATABASE_URL`. Use `DIRECT_DATABASE_URL` for Drizzle migrations when available; the running application uses the pooled `DATABASE_URL`.

`.env` is ignored by Git. Never commit a database credential.

## Commands

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
bun run db:verify
```

`db:push` is available for development-only schema reconciliation:

```bash
bun run db:push
```

Use migrations for shared/staging/production databases.

## Concurrency rules

- Global uniqueness is enforced by PostgreSQL for team names, leader identities, RA numbers, NetIDs, emails, Google IDs, attendance codes and payment/provider identifiers.
- Registration is one database transaction.
- Member add/remove locks the team with a PostgreSQL transaction-scoped advisory lock before checking the 2–4 member bound.
- Attendance uses `UNIQUE(member_id, event_date)` and `ON CONFLICT DO NOTHING`, making a duplicate scan a harmless no-op.
- Payment finalization is transactional and idempotent at the database state transition: the team is marked paid and missing attendance codes are generated together.
- Keep transactions short and never hold an open transaction while waiting on an external provider.

## Notes about the newer branch

The branch's `departments`, `announcements`, `audit_log`, and Managed Neon Better Auth integration are preserved. The PRD's canonical event states and relationships remain the source of truth for submissions, payments, attendance, rounds and scores.
