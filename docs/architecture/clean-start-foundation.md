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
- `packages/astrology` owns the astrology report generation boundary. It fails explicitly while no ephemeris engine is configured and can run the migrated local chart routine with `ASTRA_EPHEMERIS_ENGINE=local-chart-routine`.
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

Chart-maker v1 requires birth date only. Birth time, birth location, and timezone form one optional precision bundle: provide all three, or leave all three blank for date-only intake. Coordinates are carried when a configured place provider supplies them. Question, intent, and context can travel with the request when supplied. Astra stores the request and result as user-owned records, while an independent chart engine can speak through the shared `ChartMakerRequest` and `ChartMakerResult` contracts without importing Astra app code. Result writes use `/api/chart-results` with `x-astra-internal-token`; all environments require `ASTRA_INTERNAL_API_TOKEN`, including local development.

The first independent chart-maker package is `@astra/chart-maker`. It is a deterministic contract adapter: it derives safe date-based symbolic fields, preserves the birth precision bundle, emits `ChartMakerChartData`, and builds a `RecordChartMakerResult` payload for `/api/chart-results`. It does not claim to be a full ephemeris or astrology engine. Run `npm run test:chart-maker` to prove Tony's `1961-05-23` fixture derives Gemini, supports date-only intake, supports the timed/location precision bundle, and produces the result contract.

`/self` is now the first visible multi-step birth-data onboarding surface. Logged-out visitors see the email-code sign-in path. Signed-in users review subject, birth date, optional time/place precision, optional question/intent/context, and a normalized review step before submission. Submitting queues both a user-owned chart request and a linked private astrology report request.

The current onboarding flow covers:

1. Subject and relationship: self or ally, display name, and reason for creating the chart.
2. Birth date: guided date entry with validation and confirmation.
3. Precision: date-only or the full time + IANA timezone + location bundle, with plain-language consequences.
4. Place/timezone: provider-backed place search when `ASTRA_PLACE_SEARCH_PROVIDER` is configured, native IANA timezone selection, coordinates, and editable manual confirmation.
5. Intent/question/context: optional user prompt that travels with the chart-maker request.
6. Review: show the normalized payload before queuing requests.
7. Confirmation: show queued chart and report lifecycle state.

`/api/places/search` is the authenticated birth-place search edge. It accepts `q` and optional `limit`, returns typed place results with label, IANA timezone, latitude, longitude, and provider, and fails clearly with `PLACE_SEARCH_PROVIDER_UNAVAILABLE` when no provider is configured. Local smoke and Playwright coverage use the non-secret `ASTRA_PLACE_SEARCH_PROVIDER=local-fixture` provider so tests can prove place selection without introducing production credentials or hidden fallbacks.

Composer's first publishing target is `ComposerStreamArtifact`: a voice card plus a stream card and stream item whose IDs must match. Composer remains implementation-free in the foundation, but the publish contract is available before internals are built.

Composer's minimal implementation lives under `apps/composer-web/src` and stays independent from Astra app internals. It provides:

- a deterministic `guide` / `companion` / `prompt` voice registry,
- a validation gate for word limits, banned terms, and moralizing language,
- `publishComposerStreamArtifact`, which validates a voice card, carries a plain rationale, and emits a shared stream artifact contract.

Run `npm run test:composer-stream` to prove valid fixtures pass, invalid fixtures fail, and a stream artifact publishes through the shared contract.

Astra consumes Composer artifacts through `/api/composer/stream-artifacts`, guarded by `x-astra-internal-token`. The route validates `composerStreamArtifactSchema`, persists the card and stream item through `upsertComposerStreamArtifact`, and `/journey` reads the persisted public stream from Postgres. Astra does not import Composer app code for this handoff.

Run `npm run test:composer-ingest-api` with the local app running to prove an internal Composer-style caller can publish a stream artifact and that `/journey` renders the resulting card.

## Astrology Report Lifecycle

Astrology reports are a separate lifecycle from chart-maker results. Shared contracts define `AstrologyReportRequest`, `AstrologyReportResult`, report sections, provenance, status, and the private/public signal boundary. Raw report requests, report sections, provenance, and engine errors are private and user-owned. Composer may consume only explicit `AstrologyReportPublicSignal` payloads, which summarize enough for a stream card without hauling raw private report content through the public stream.

Astra persists report lifecycle state in Drizzle-owned `astrology_report_requests` and `astrology_report_results` tables. Requests are created by authenticated users through `/api/reports`; internal report writers record results through `/api/report-results` with `x-astra-internal-token`. Missing or wrong `ASTRA_INTERNAL_API_TOKEN` returns `INTERNAL_TOKEN_REQUIRED`; local smoke scripts load the ignored app env file instead of inventing defaults.

`@astra/astrology` is now a real module boundary. Without `ASTRA_EPHEMERIS_ENGINE`, it returns a failed `RecordAstrologyReportResult` that records the accepted request and explicit engine-unavailable provenance. With `ASTRA_EPHEMERIS_ENGINE=local-chart-routine`, it uses the prior Astria `circular-natal-horoscope-js` routine for tropical + Whole Sign chart signatures. Report writing is a separate switch: `ASTRA_REPORT_WRITER=local-deterministic-writer` emits private sections/provenance and an explicit public signal for Composer without an LLM call, paid provider, or credit spend.

Signed-in users can generate their own queued report through `/api/reports/[requestId]/generate`. The route authorizes ownership, builds the configured astrology result server-side, records it through the same Drizzle transaction used by internal writers, and returns the updated request/result for `/self` to show completed status and the public-signal headline. `/self` also renders a private report reader for the signed-in user's generated sections and provenance. This is a private user-owned report action, not a public stream publish.

Completed report generation also creates a deterministic user-owned `report:<requestId>` library artifact. `/library` shows signed-in users their private artifacts, including generated reports, while signed-out visitors keep the public foundation artifact view. Older completed report results without a persisted artifact are merged into the signed-in library view as report artifacts so local generated reports remain visible after this slice.

Generated reports can publish their explicit public signal through `/api/reports/[requestId]/publish-signal`. The route authorizes ownership, requires a completed result with `publicSignal`, and writes only the Composer-shaped stream artifact into the public `/journey` read model. Raw report sections, provenance detail, and engine payloads remain private in `/self` and the report result tables.

Composer can publish report-derived stream cards through `publishAstrologyReportSignalArtifact`, which accepts `AstrologyReportPublicSignal` and emits the same `ComposerStreamArtifact` contract Astra already ingests. Run `npm run test:astrology-engine` to prove both unconfigured failure and configured local engine completion, including Tony's Gemini/Virgo/Cancer fixture, Einstein's public AA Pisces/Sagittarius/Cancer fixture, deterministic writer provenance, and unsupported-writer fail-closed behavior. Run `npm run test:report-api` with the local app, migrated database, Mailpit, and app-local env loaded to prove authenticated report create/list, user-owned generation, missing-token rejection, wrong-token rejection, completed internal result recording, non-LLM writer evidence, and public-signal preservation.

Run `npm run test:place-search-api` with the local app, Mailpit, and `ASTRA_PLACE_SEARCH_PROVIDER=local-fixture` loaded to prove unauthenticated place search is rejected and authenticated search returns timezone/coordinate-backed place results.

## Stream Read Model

`/journey` is the first DB-backed reader surface. It shows lane filtering, save/reflect actions, card detail, stream-item metadata, report-signal metadata, and explicit loading/empty/error states. Report-linked cards must enter this surface through Composer-published `ComposerStreamArtifact` records derived from `AstrologyReportPublicSignal`; raw private report payloads never move into public stream cards.

See `docs/architecture/stream-read-model-cache-boundary.md` for the production read-model, cache tag, invalidation, and origin-failure rules.

## Future Delivery Posture

For published Composer stream artifacts and future public/read-model data, expect edge-first caching with explicit origin failure. Keep this out of the first foundation until production retrieval is designed, and do not silently substitute stale or placeholder content when the origin path is broken.
