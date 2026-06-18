# Astra Clean Start

Astra Clean Start is a lean symbolic reader/account foundation.

Local defaults:

- Astra web: `http://localhost:3011`
- Composer web: `http://localhost:3012`

Useful commands:

```bash
npm install
npm run dev
npm run dev:status
npm run composer:dev
npm run composer:up
npm run composer:status
npm run composer:restart
npm run composer:stop
npm run composer:logs
npm run lint
npm run typecheck
npm run test
npm run test:auth-code
npm run check:boundaries
npm run check:no-supabase
npm run build
npm run test:e2e
npm run db:migrate
npm run db:seed -- --execute
npm run db:reset:local -- --execute
```

The first foundation intentionally uses seeded data and clean boundaries before extracting old Astria machinery.

For normal local review, use the durable launchers: `npm run dev:up` for Astra on `3011` and `npm run composer:up` for Composer on `3012`. Use `composer:dev` only for short foreground iteration. Durable status checks verify both the reserved port listener and a real route response.

UI handles and route chrome live in app-local i18n dictionaries: `apps/astra-web/lib/i18n.ts` for Astra and `apps/composer-web/lib/i18n.ts` for Composer. Route components should consume those dictionaries instead of hardcoding navigation labels, headings, aria labels, status text, form labels, or button text.

Database commands are dry-run by default where destructive or mutating behavior is involved. Point `ASTRA_DATABASE_URL` at a disposable local Postgres database before running mutating commands. `db:reset:local -- --execute` refuses non-local database hosts unless `ASTRA_ALLOW_DB_RESET=1` is set for a disposable database.

Local auth email uses Mailpit by default: SMTP `127.0.0.1:1025`, inbox `http://localhost:8025`. Set `ASTRA_EMAIL_DELIVERY=file` to capture mail in `.astra-email/outbox.jsonl` instead.

`npm run test:auth-code` expects Astra to be running at `ASTRA_AUTH_SMOKE_BASE_URL` or `http://localhost:3011/api/auth`, a migrated local database behind that app, and Mailpit at `MAILPIT_API_URL` or `http://localhost:8025`.
