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
- The preferred user login flow is email code first: send code, verify code, continue without a password prompt.
- Database schema is Drizzle-owned and contains Better Auth plus Astra-owned tables.
- Chart-maker communication starts as explicit request/result contracts with user-owned persistence.
- Composer's first publishing target is a stream artifact contract.
- Seed/reset commands are explicit: dry-run by default, executable only with `--execute`, and destructive reset is local-host guarded.
- Composer is visible as a boundary but not implemented.
- Supabase assumptions are rejected by checks and database URL guards.

## Boundaries

- `packages/contracts` defines public nouns.
- `packages/db` owns schema/client.
- `packages/db/src/repositories.ts` owns typed seed, reset, snapshot, and profile bootstrap helpers.
- `packages/db/src/repositories.ts` also owns the local chart-maker request/result lifecycle boundary.
- `apps/astra-web` renders product routes and owns auth integration.
- `apps/astra-web/lib/email/send-email.ts` owns email delivery and local email capture.
- `apps/astra-web/lib/i18n.ts` owns app UI handles and route chrome copy.
- `packages/testkit` owns seed fixtures and test factories.
- Composer and astrology do not leak into Astra runtime.
- `npm run check:boundaries` enforces the charter rule that Astra and Composer do not import each other and packages do not import app code.

## Local Database Loop

```bash
npm run db:migrate
npm run db:seed -- --execute
npm run db:reset:local -- --execute
```

The local database defaults to `postgresql://astra:astra@127.0.0.1:5432/astra_clean_start`, but any disposable local Postgres URL can be supplied with `ASTRA_DATABASE_URL`. Runtime code never performs DDL; schema changes go through Drizzle migrations.

Local auth email uses Mailpit by default: SMTP `127.0.0.1:1025`, inbox `http://localhost:8025`. Set `ASTRA_EMAIL_DELIVERY=file` to capture mail in `.astra-email/outbox.jsonl` instead.

Run `npm run test:auth-code` when a local app server, migrated local database, and Mailpit are available. The smoke sends a sign-in OTP, retrieves the code from Mailpit, verifies it through Better Auth, checks the session, and signs out.

Run `npm run test:chart-boundary` after migrations to prove Astra can create a user-owned chart-maker request, record an independent engine result, and list the completed request for that user.

## Chart Maker And Composer Boundary

Chart-maker v1 accepts birth data plus optional question, intent, and context. Astra stores the request and result as user-owned records, while an independent chart engine can speak through the shared `ChartMakerRequest` and `ChartMakerResult` contracts without importing Astra app code.

Composer's first publishing target is `ComposerStreamArtifact`: a voice card plus a stream card and stream item whose IDs must match. Composer remains implementation-free in the foundation, but the publish contract is available before internals are built.

## Future Delivery Posture

For published stream artifacts, prefer edge-first caching with origin fallback. Keep this out of the first foundation until the publishing contract exists, but do not design future retrieval paths around request-time origin dependency only.
