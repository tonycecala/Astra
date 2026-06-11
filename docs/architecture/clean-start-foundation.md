# Clean Start Foundation

## Shape

```txt
apps/
  astra-web/       user-facing symbolic reader
  composer-web/    placeholder boundary
packages/
  contracts/       Zod schemas and TypeScript nouns
  db/              Drizzle schema and database client
  ui/              shared visual tokens and future atoms
  config/          shared constants
  testkit/         typed seed fixtures
  astrology/       placeholder extraction target
```

## First Stable Subassembly

The foundation proves:

- Astra opens locally on port `3011`.
- Journey, Allies, Self, Library, and Gifts render from typed seed data.
- Better Auth is wired through a clean route boundary and a small visible `/login` panel.
- Database schema is Drizzle-owned and contains Better Auth plus Astra-owned tables.
- Seed/reset commands are explicit: dry-run by default, executable only with `--execute`, and destructive reset is local-host guarded.
- Composer is visible as a boundary but not implemented.
- Supabase assumptions are rejected by checks and database URL guards.

## Boundaries

- `packages/contracts` defines public nouns.
- `packages/db` owns schema/client.
- `packages/db/src/repositories.ts` owns typed seed, reset, snapshot, and profile bootstrap helpers.
- `apps/astra-web` renders product routes and owns auth integration.
- `apps/astra-web/lib/email/send-email.ts` owns email delivery and local email capture.
- `apps/astra-web/lib/i18n.ts` owns app UI handles and route chrome copy.
- `packages/testkit` owns seed fixtures and test factories.
- Composer and astrology do not leak into Astra runtime.

## Local Database Loop

```bash
npm run db:migrate
npm run db:seed -- --execute
npm run db:reset:local -- --execute
```

The local database defaults to `postgresql://astra:astra@127.0.0.1:5432/astra_clean_start`, but any disposable local Postgres URL can be supplied with `ASTRA_DATABASE_URL`. Runtime code never performs DDL; schema changes go through Drizzle migrations.

Local auth email is captured to `.astra-email/outbox.jsonl` unless an SMTP host or Resend key is configured.
