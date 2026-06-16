# Clean Start Foundation

## Shape

```txt
apps/
  astra-web/       user-facing symbolic reader
  composer-web/    placeholder boundary
packages/
  contracts/       Zod schemas and TypeScript nouns
  db/              Drizzle schema and database client
  chart-maker/     independent chart request/result engine boundary
  ui/              shared visual tokens and future atoms
  config/          shared constants
  testkit/         typed seed fixtures
  astrology/       placeholder extraction target
```

## First Stable Subassembly

The foundation proves:

- Astra opens locally on port `3011`.
- Journey, Allies, Self, Library, and Gifts render from the local database snapshot seeded by typed fixtures.
- Better Auth is wired through a clean route boundary and a small visible `/login` panel.
- The preferred user login flow is email code first: send code, verify code, continue without a password prompt.
- Database schema is Drizzle-owned and contains Better Auth plus Astra-owned tables.
- Chart-maker communication starts as explicit request/result contracts with user-owned persistence.
- `@astra/chart-maker` consumes `ChartMakerRequest` and emits `RecordChartMakerResult` without importing Astra app or database internals.
- Composer's first publishing target is a stream artifact contract that Astra can ingest without importing Composer internals.
- Seed/reset commands are explicit: dry-run by default, executable only with `--execute`, and destructive reset is local-host guarded.
- Composer is visible as a boundary but not implemented.
- Supabase assumptions are rejected by checks and database URL guards.

## Boundaries

- `packages/contracts` defines public nouns.
- `packages/db` owns schema/client.
- `packages/db/src/repositories.ts` owns typed seed, reset, snapshot, Composer stream ingest, and profile bootstrap helpers.
- `packages/db/src/repositories.ts` also owns the local chart-maker request/result lifecycle boundary.
- `packages/chart-maker` owns deterministic chart-maker computation and speaks only through shared contracts.
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

Run `npm run test:chart-request-api` with the local app and Mailpit running to prove a signed-in user can create/list chart requests through `/api/chart-requests`, and that an internal chart-maker caller can record a result through `/api/chart-results`.

## Chart Maker And Composer Boundary

Chart-maker v1 requires birth date only. Birth time, birth location, and timezone form one optional precision bundle: provide all three, or leave all three blank for date-only intake. Coordinates, question, intent, and context are optional until onboarding defines stronger requirements. Astra stores the request and result as user-owned records, while an independent chart engine can speak through the shared `ChartMakerRequest` and `ChartMakerResult` contracts without importing Astra app code. Result writes use `/api/chart-results` with `x-astra-internal-token`; all environments require `ASTRA_INTERNAL_API_TOKEN`, including local development.

The first independent chart-maker package is `@astra/chart-maker`. It is a deterministic contract adapter: it derives safe date-based symbolic fields, preserves the birth precision bundle, emits `ChartMakerChartData`, and builds a `RecordChartMakerResult` payload for `/api/chart-results`. It does not claim to be a full ephemeris or astrology engine. Run `npm run test:chart-maker` to prove Tony's `1961-05-23` fixture derives Gemini, supports date-only intake, supports the timed/location precision bundle, and produces the result contract.

`/self` is the first visible chart-maker handoff surface. Signed-in users can queue a chart request; logged-out visitors see the email-code sign-in path instead. The form uses explicit text formats for birth date and time so the handoff payload stays clear and testable.

The current `/self` chart request form is a foundation smoke surface, not the final user onboarding. Before this becomes a primary product path, replace it with a multi-step birth-data onboarding flow:

1. Subject and relationship: self or ally, display name, and reason for creating the chart.
2. Birth date: guided date entry with validation and confirmation.
3. Birth time: known time, approximate time, or unknown time, with plain-language consequences.
4. Birth place: city search/geocoding, timezone resolution, and editable confirmation.
5. Intent/question/context: optional user prompt that travels with the chart-maker request.
6. Review: show the normalized payload before queuing the chart-maker request.
7. Confirmation: show queued/processing/completed state and explain what happens next.

Composer's first publishing target is `ComposerStreamArtifact`: a voice card plus a stream card and stream item whose IDs must match. Composer remains implementation-free in the foundation, but the publish contract is available before internals are built.

Composer's minimal implementation lives under `apps/composer-web/src` and stays independent from Astra app internals. It provides:

- a deterministic `guide` / `companion` / `prompt` voice registry,
- a validation gate for word limits, banned terms, and moralizing language,
- `publishComposerStreamArtifact`, which validates a voice card, carries a plain rationale, and emits a shared stream artifact contract.

Run `npm run test:composer-stream` to prove valid fixtures pass, invalid fixtures fail, and a stream artifact publishes through the shared contract.

Astra consumes Composer artifacts through `/api/composer/stream-artifacts`, guarded by `x-astra-internal-token`. The route validates `composerStreamArtifactSchema`, persists the card and stream item through `upsertComposerStreamArtifact`, and `/journey` reads the persisted public stream from Postgres. Astra does not import Composer app code for this handoff.

Run `npm run test:composer-ingest-api` with the local app running to prove an internal Composer-style caller can publish a stream artifact and that `/journey` renders the resulting card.

## Future Delivery Posture

For published Composer stream artifacts and future public/read-model data, expect edge-first caching with explicit origin failure. Keep this out of the first foundation until production retrieval is designed, and do not silently substitute stale or placeholder content when the origin path is broken.
