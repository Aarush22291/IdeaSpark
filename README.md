# IdeaSpark

## Local setup

```bash
bun install
cp .env.example .env
```

Fill `.env` with the Neon and Managed Auth values for your environment.

## Database workflow

```bash
bun run db:migrate
bun run db:seed
bun run db:verify
```

For development-only schema reconciliation:

```bash
bun run db:push
```

Use versioned migrations for shared, staging and production databases.

## Database architecture

- Neon PostgreSQL is the source of truth.
- Drizzle ORM defines the schema in `src/db/schema.ts`.
- `src/db/index.ts` uses a bounded Neon connection pool.
- `src/db/transactions.ts` contains concurrency-sensitive atomic writes.
- `src/db/queries.ts` contains reusable read queries.
- `drizzle/0000_ideaspark_prd_baseline.sql` defines the final schema for a fresh database.

The newer branch's `departments`, `announcements`, `audit_log`, and Managed Neon Better Auth integration are preserved. The PRD remains the source of truth for team/member identity, submissions, payments, attendance, evaluation rounds, scores and admin roles.

## Safety

The baseline migration is non-destructive: it creates the target schema but does not drop old tables. If a Neon database already contains the earlier experimental schema, inspect the existing data and perform a deliberate data migration before applying this baseline.

Never commit `.env` or database credentials.
