# IdeaSpark Database

The database is PostgreSQL on Neon and is modeled from `IdeaSpark-Backend-PRD.md`.
Drizzle ORM is the schema/query layer.

## Structure

- `src/db/schema.ts` — enums, tables, foreign keys, uniqueness constraints, partial indexes, and supporting indexes.
- `src/db/index.ts` — shared Neon/Drizzle database client.
- `src/db/queries.ts` — read/query helpers for active tracks, teams, submissions, attendance, leaderboard, and active rounds.
- `src/db/transactions.ts` — transactional write helpers for multi-step state changes.
- `drizzle/0000_ideaspark_backend.sql` — initial SQL migration for the PRD schema.
- `scripts/seed.ts` — optional bootstrap of the singleton event config and first super-admin.

## Environment

Set `DATABASE_URL` to the Neon PostgreSQL connection string. Do not commit `.env` or `.env.local`.

Optional seed variables:

```text
REGISTRATION_DEADLINE=2026-10-01T10:00:00Z
SUBMISSION_DEADLINE=2026-10-10T10:00:00Z
REGISTRATION_FEE=1500.00
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_NAME=Event Admin
```

## Commands

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:check
bun run db:seed
```

The repository documents `drizzle-kit push` for direct application during development. Prefer committed migrations for shared/staging/production environments.
