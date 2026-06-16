---
title: "Astra Clean Start Foundation Progress"
status: "open"
date: "2026-06-12"
updated: "2026-06-16"
tags: ["mission", "astra", "clean-start", "foundation", "progress"]
related: ["../../docs/architecture/clean-start-foundation.md", "../../ASTRA_CLEAN_START_INAUGURAL_CHARTER.md"]
---

# Astra Clean Start Foundation Progress

## Mission
Build Astra as a clean-start foundation: a lean, light, modular symbolic stream reader with stable subassemblies, explicit contracts, Better Auth, Drizzle/Postgres, seeded data, durable local operation, and no Supabase carryover. Astra is not a newspaper; Composer privately assembles each user's next meaningful card from public source material, personal state, timing, progress, and explicit permissions.

## Goal
Keep `/Users/tony/Documents/Projects/Astra` as the new clean repo and `/Users/tony/Documents/Projects/Astria` as the quarry. Astra should render the first useful reader shell while Composer remains a clean boundary that publishes only through shared contracts.
The production journey must be a private, authenticated, user-owned feed; public/shared stream rows are source or fallback material, not the core product path.

## Files Changed
- `apps/astra-web/` implements the visible reader shell, auth route, i18n-backed UI chrome, theme behavior, and route-level product surfaces.
- `apps/composer-web/` exists as a separate subassembly with voice validation and stream artifact publishing, but no Astra runtime coupling.
- `packages/contracts/` defines typed core nouns.
- `packages/db/` owns Drizzle schema, migrations, client, repository helpers, seed/reset support, and Better Auth tables.
- `packages/chart-maker/` owns the independent chart-maker contract adapter.
- `packages/astrology/` owns the astrology report generation boundary, explicit engine-unavailable result adapter, and migrated local `circular-natal-horoscope-js` chart routine adapter.
- `packages/testkit/` owns typed seed fixtures.
- `scripts/` contains foundation checks, no-Supabase checks, boundary checks, seed/reset scripts, auth-code smoke support, and durable local server controls.
- `docs/architecture/clean-start-foundation.md` documents the foundation shape and local database/auth loop.
- `docs/architecture/local-dev-server.md` documents durable local server operation.
- `akashic/warnings/local-dev-server-tab-is-not-server-proof.md` captures the stale-tab/server-proof lesson.

## Decisions Made
- Astra and Composer are subassemblies inside one npm workspace repo, not nested git repos or submodules.
- Astra is a fresh app and only migrates structure, contracts, and proven ideas; old routes and old clutter stay behind.
- Foundation stack is Next.js, React, TypeScript, Drizzle, Postgres/Neon posture, Better Auth, Vercel posture, and Playwright.
- User-facing UI handles, navigation labels, headings, aria labels, buttons, tabs, and state labels must flow through i18n.
- Preferred auth UX is email code first: send code, verify code, continue without password-first framing.
- Mailpit is the preferred local email sink.
- Composer internals must not leak into Astra.
- `/journey` is a private personalized journey by default. Any public/shared feed is a fallback/source layer, not the product's soul.
- Supabase carryover is forbidden: no packages, env vars, imports, legacy policy assumptions, compatibility shims, or runtime DDL.
- Long-running local app review should use durable server controls instead of foreground-only dev sessions.

## Problems Encountered
- A foreground Next.js dev server on port `3011` became unreliable across agent/platform sessions.
- A stale browser tab could make the app appear available or unavailable without proving the server was actually healthy.
- A wedged process could listen on `3011` while `/login` timed out.
- Astra initially had an unread Akashic inbox message about the Munch stack; it was acted on and the repo was indexed locally.

## Lessons Learned
- For local app work, `port listening` is not enough; status must verify a real route response.
- Durable local launchers should write ignored pid/log state and provide `up`, `status`, `restart`, and `stop`.
- Akashic-facing repos need a durable progress artifact, not only chat summaries or README notes.
- The Akashic term for this structured progress record is `mission`.

## Current State
- Astra server is running on `http://localhost:3011`.
- `npm run dev:status` reports `/login 200 OK`.
- Journey, Allies, Self, Library, Gifts, and Login render.
- Playwright route coverage includes desktop, tablet, and mobile.
- Recent validation passed: lint, typecheck, foundation test, boundary check, no-Supabase check, production build, and Playwright e2e.
- Latest relevant Astra commits include durable local server work and Akashic governance installation.
- Local Postgres `postgresql://astra:astra@127.0.0.1:5432/astra_clean_start` is available through Homebrew PostgreSQL 16.
- Drizzle migration, seed, local guarded reset, remigration, and reseed have been exercised against the disposable local database.
- Mailpit is running at `http://localhost:8025`, and the email-code auth smoke passed through send-code, Mailpit OTP read, verify-code, session check, and sign-out.
- Browser verification proved `/login` can send and verify an email code and then display the authenticated session for the browser-smoke user.
- `/self` now reads authenticated app profile state through `getAstraAuthContext`; logged-out visitors see a sign-in CTA, while signed-in users see their own display name, onboarding state, and private star balance.
- Chart-maker contracts now require birth date only; birth time, location, timezone, and coordinates form an optional precision bundle once provider-backed place lookup supplies them. Question, intent, and context can travel with the request when supplied.
- `@astra/chart-maker` now consumes `ChartMakerRequest` and emits `RecordChartMakerResult` without importing Astra app or database internals.
- `ChartMakerChartData` defines the first deterministic chart-maker payload shape with precision metadata, date-derived symbolic fields, interpretation, and explicit limits.
- Drizzle owns `chart_requests` and `chart_results` tables with user ownership and request/result indexes.
- `npm run test:chart-boundary` proves the local request/result lifecycle against Postgres.
- `/api/chart-requests` now lets an authenticated user create and list their own chart requests.
- `/api/chart-results` lets an internal chart-maker caller record a result behind `x-astra-internal-token`.
- `/self` now includes a multi-step birth-data onboarding panel that queues a user-owned chart request and a linked private astrology report request after a final review step.
- `npm run test:chart-maker` proves Tony's `1961-05-23` fixture through the independent chart-maker module, including date-only and timed/location precision paths.
- `npm run test:chart-request-api` proves request creation through Better Auth/Mailpit and result recording through the internal chart-maker token using the independent chart-maker module.
- The current `/self` onboarding flow captures subject, birth date, optional time/place precision bundle, optional question/intent/context, and review/confirmation state before queuing chart and report lifecycle records.
- `/api/places/search` now provides an authenticated birth-place search boundary with typed place results and fail-clear provider configuration.
- `@astra/astrology` now owns the place-search provider boundary; local verification uses `ASTRA_PLACE_SEARCH_PROVIDER=local-fixture` and missing/unknown providers fail explicitly.
- `BirthOnboardingPanel` can search/select a birth place, auto-fill IANA timezone plus coordinates, and still allows editable manual confirmation.
- Composer's first publish target is now a shared stream artifact contract.
- Composer now has a minimal independent implementation for voice registry, deterministic validation, and stream artifact publishing under `apps/composer-web/src`.
- `npm run test:composer-stream` proves valid voice fixtures, invalid voice fixtures, and stream artifact publishing through the shared contract.
- Composer stream artifacts now include a rationale so Astra can explain why a card appears.
- Astra now exposes `/api/composer/stream-artifacts` as an internal token-guarded ingestion edge for Composer-published stream artifacts.
- `upsertComposerStreamArtifact` persists Composer cards and stream items into Astra's existing transitional stream tables without importing Composer internals. This must evolve into private `UserFeedItem` projections before the personalized stream is considered architecturally correct.
- Journey, Allies, Library, and Gifts now read the persisted local database snapshot instead of seed-only in-memory fixtures.
- `npm run test:composer-ingest-api` proves a Composer-style caller can publish a stream artifact and `/journey` renders the consumed card.
- Shared contracts now define the astrology report lifecycle: report requests, results, sections, provenance, status, cost placeholder, and explicit private/public signal boundaries.
- Drizzle owns `astrology_report_requests` and `astrology_report_results` tables with user ownership, optional chart-request linking, status indexes, engine/version metadata, timestamps, and result uniqueness by request.
- `/api/reports` lets an authenticated user create and list private astrology report requests.
- `/api/report-results` lets an internal report writer record a result behind `x-astra-internal-token`.
- `@astra/astrology` now fails explicitly when no `ASTRA_EPHEMERIS_ENGINE` is configured instead of fabricating production astrology.
- Composer can consume `AstrologyReportPublicSignal` through `publishAstrologyReportSignalArtifact`, keeping raw private report payloads out of Composer internals and shared fallback/source rows.
- `/journey` now labels the persisted stream as DB-backed and report-signal ready.
- `/self` now shows compact report lifecycle/private-boundary status for signed-in users.
- `npm run test:report-api` proves auth-required report access, authenticated create/list, user-owned report generation, missing-token rejection, wrong-token rejection, configured local-engine result recording, and public-signal preservation.
- Composer report-signal artifacts now publish as `artifact` stream items so `/journey` can distinguish report-derived cards from ordinary cards.
- `npm run test:composer-ingest-api` now proves both a generic Composer card and a report-signal card can be token-ingested and rendered by `/journey`.
- `/journey` now shows stream-item metadata in cards and detail, including item kind, status, audience, and published date.
- `/journey` now has explicit loading and DB-read error states instead of relying only on a successful happy path.
- `docs/architecture/stream-read-model-cache-boundary.md` now defines the private personal feed read model, cache split, invalidation rule, and origin-failure behavior while keeping public/shared stream content as fallback/source material only.
- `npm run test:place-search-api` proves unauthenticated place search is rejected and authenticated local-fixture search returns New York with timezone/coordinates.
- Browser QA on `/self` proved the signed-in onboarding journey can search `New`, select `New York, NY, USA`, review `08:30, America/New_York, New York, NY, USA`, queue linked chart/report records, and render desktop/tablet/phone with no console errors or horizontal overflow.
- `@astra/astrology` can now run `ASTRA_EPHEMERIS_ENGINE=local-chart-routine` through the migrated `circular-natal-horoscope-js` routine from Astria, preserving tropical + Whole Sign chart signatures before writing completed private report sections plus a Composer-safe public signal.
- `npm run test:astrology-engine` proves unconfigured engine failure still names `ASTRA_EPHEMERIS_ENGINE`, while configured local engine completion emits Tony's Gemini Sun, Virgo Moon, Cancer rising fixture and Einstein's public AA Pisces Sun, Sagittarius Moon, Cancer rising fixture.
- `@astra/astrology` now separates chart computation from report writing with `ASTRA_REPORT_WRITER=local-deterministic-writer`; the first writer route is non-LLM, non-paid, records writer provenance, and fails closed for unsupported writer names before any lower-debug model route can run.
- `/api/reports/[requestId]/generate` now lets a signed-in user generate their own queued report through the configured engine without exposing raw private sections publicly or using the internal writer token.
- `/self` now shows a compact Generate action for queued reports, then updates the side rail to completed status with the Composer-safe public headline after generation.
- `/self` now includes a private report reader for generated sections and provenance, keeping raw report content in the authenticated self surface instead of the stream projection boundary.
- Completed report generation now upserts a deterministic user-owned report artifact, and `/library` shows signed-in users their private artifacts while signed-out visitors keep the foundation artifact view.
- `/library` also merges older completed report results as report artifacts when no persisted artifact row exists yet, so existing local generated reports remain reviewable.
- `/api/reports/[requestId]/publish-signal` now lets a signed-in user publish only their completed report's explicit boundary signal into the current `/journey` transitional stream; private sections and detailed provenance stay in `/self` and report result storage.
- Browser QA on `/self` proved the visible Generate action can complete a queued browser-smoke report, and desktop/tablet/phone reloads show completed report status with no new console errors or horizontal overflow.
- Browser QA also proved the private report reader renders `Core pattern` and `Provenance` on desktop/tablet/phone with no new console errors or horizontal overflow.
- Browser QA on `/library` proved signed-in report artifacts render on desktop/tablet/phone with no console errors or horizontal overflow.
- Browser QA on `/journey` proved the published report signal renders as report-signal metadata on desktop/tablet/phone with no console errors or horizontal overflow.
- `akashic/agent-inbox/2026-06-16-next-clean-thread-report-writer-model-handoff.md` now captures the clean next-thread start point for the lower-debug model-backed report writer route.
- `ASTRA_REPORT_WRITER=debug-model-writer` now exists as an opt-in async writer route behind `ASTRA_REPORT_MODEL_PROVIDER=openai`, `ASTRA_REPORT_MODEL`, and `ASTRA_OPENAI_API_KEY`. Missing config and unsupported providers fail closed as private failed report results before any model call, while `local-deterministic-writer` remains the default baseline and public-signal oracle.
- `npm run test:astrology-engine` now proves the mocked OpenAI Responses API success path, malformed model-output failure, provider/model provenance, and the rule that model output cannot rewrite the deterministic public signal.
- Astra's private personal feed boundary now has v0 shared contracts, Drizzle tables, migration, and repository helpers for `SourceCard`, `PublicStreamItem`, `UserFeedItem`, `ComposerDecision`, `PrivateFeedRequest`, and `PrivateFeedResponse`.
- `npm run test:private-feed` proves User A can read User A's feed item, cannot read User B's feed item, Composer decisions cannot attach across users, public fallback rows do not carry private payload, and private feed responses do not expose raw decision internals.
- `/journey` now uses authenticated private feed semantics: signed-in users read `UserFeedItem` projections, first-visit users receive deterministic private projections from public-safe fallback material, and signed-out readers see an explicitly labeled public fallback.
- Report signal publishing now writes a deterministic user-owned `report_signal` feed item for the signed-in user, so generated report cards enter Journey through the private feed boundary rather than the transitional global stream reader.

## Follow-Ups
- Select the production birth-place provider and replace/extend the local fixture adapter without changing the `/api/places/search` contract.
- Replace the deterministic chart-maker contract adapter with or behind a real ephemeris-backed module when the chart computation engine is selected.
- Decide whether the migrated `circular-natal-horoscope-js` adapter is the production v1 chart routine or should remain a local proof behind a later production ephemeris provider.
- Exercise the first lower-debug model-backed writer with real OpenAI account config on synthetic/public fixtures, then compare private sections against the non-LLM deterministic writer output before enabling it for normal private reports.
- Move Composer's active source-card/review/write workflow fully onto private feed projections and retire the transitional global stream publish path once Composer has a private write edge.
- Continue polishing reader density, card states, gifts/stars presentation, self/profile usefulness, and i18n-backed empty/error/loading states.
- Update this mission after each non-trivial dev/debug session.
