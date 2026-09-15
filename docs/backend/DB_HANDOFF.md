# IdeaSpark database handoff

## Done in this branch

- Canonical Drizzle/PostgreSQL schema aligned to the Backend PRD.
- Preserved newer-branch departments, announcements, audit log and Managed Neon Better Auth.
- Added admin allow-list and roles in the database.
- Added one-team-per-leader identity protection.
- Added global RA number / NetID / email / Google ID / attendance-code uniqueness.
- Added one-leader-per-team partial unique index.
- Added one-submission-per-team canonical submission record with PRD review states.
- Added PRD payment transaction model with Razorpay identifiers and a team-level payment status.
- Attendance is per member per date with an idempotent uniqueness boundary.
- Added evaluation rounds, one-active-round protection and evaluator/team/round score uniqueness.
- Added event config singleton and deadline/fee validation.
- Added indexes for common lookup/filter/join paths.
- Added Neon connection pooling with a configurable per-process maximum.
- Added transactional registration, member add/remove and payment finalization helpers.
- Added a PostgreSQL advisory-lock-backed trigger for the four-member maximum, so concurrent member writes cannot create a fifth member.
- Added reusable DB queries for teams, attendance, leaderboard and admin filtering.
- Added seed and verification scripts.
- Added migration SQL and Drizzle migration journal.
- Added `.env.example` and DB operational documentation.

## Intentionally left for integration by other backend/event owners

1. Google OAuth provider configuration and production credentials. Managed Neon Better Auth is preserved; the database stores the application identity and optional Google subject field.
2. Razorpay API calls, signature verification and webhook HTTP route. The database has the fields and an atomic `markPaymentPaidAtomically` helper ready to be called after the provider is verified.
3. Email provider integration and delivery workers. Audit/announcement persistence is ready.
4. The final official department list if the event team provides a list different from the current catalogue.
5. Production migration execution against Neon. The repo is prepared for migration, but this execution environment does not have Bun/Drizzle runtime packages or a PostgreSQL CLI/network path to the private Neon project, so no claim of remote execution is made.
6. A data migration from the newer experimental integer-ID `teams/team_members/ideas` tables, if those tables already contain data in the shared Neon database. The baseline migration is intentionally non-destructive and will not automatically drop or rewrite existing data.

## Important architecture decision

The newer branch had an `ideas` table and manual payment-review flow. Those are not the canonical production states in the PRD, so the final schema uses `submissions` and Razorpay transaction state as the source of truth. The branch's extra capabilities (department catalogue, announcements, audit logging, rubric fields) remain available.


## Recent event-specific decisions

- Team leader identity is stored only as `teams.lead_user_id` from Neon Auth. `members` contains no email or Google ID fields because non-leaders do not need accounts.
- The roster is 2–4 members at creation. Add/remove remains available until the registration deadline, but any add/remove against a paid team fails with `Roster is locked after payment`; the database migration also installs a DB-level trigger for this invariant.
- Submissions are per evaluation round. The canonical key is `(team_id, round_id)`, so ISD1 and ISD2 have independent submission records.
- Razorpay checkout signatures and webhook signatures are verified server-side using HMAC-SHA256. Webhook verification uses the exact raw request body.
- Attendance codes are minted with one set-based `UPDATE`, not a per-member loop, after a verified payment is finalized.
- The obsolete `department_enum` is no longer part of the application schema. Departments are driven by the `departments` table and the official 30-entry seed catalogue in `src/db/seed-departments.ts`.
