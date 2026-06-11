# Astra Clean Start

Astra Clean Start is a lean symbolic reader/account foundation.

Local defaults:

- Astra web: `http://localhost:3011`
- Composer reserved: `http://localhost:3012`

Useful commands:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run check:no-supabase
npm run build
npm run test:e2e
npm run db:migrate
npm run db:seed -- --execute
npm run db:reset:local -- --execute
```

The first foundation intentionally uses seeded data and clean boundaries before extracting old Astria machinery.

UI handles and route chrome live in `apps/astra-web/lib/i18n.ts`; route components should consume that dictionary instead of hardcoding navigation labels, headings, aria labels, or button text.

Database commands are dry-run by default where destructive or mutating behavior is involved. Point `ASTRA_DATABASE_URL` at a disposable local Postgres database before running mutating commands. `db:reset:local -- --execute` refuses non-local database hosts unless `ASTRA_ALLOW_DB_RESET=1` is set for a disposable database.

Local auth email is captured to `.astra-email/outbox.jsonl` unless `MAILPIT_SMTP_HOST` or a Resend key is configured.
