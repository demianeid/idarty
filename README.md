# Idarty

## Environment

Set `BETTER_AUTH_SECRET` to a random value of at least 32 characters.

`SKIP_EMAIL_VERIFICATION=true` is for local development and isolated test environments only. It is honored only when both `NODE_ENV` and `VERCEL_ENV` are not `production`; the application fails loudly at startup if it is enabled in production.

## Database migrations

Apply SQL migrations through the approved Neon workflow. `db/migrations/0002_phase_a_followups.sql` is additive and idempotent; do not apply it to the main database without approval.
