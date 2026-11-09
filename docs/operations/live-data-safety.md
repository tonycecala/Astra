# Live database safety and owner activity notices

## Production contract

As of November 9, 2026, `astraportrait.com` and `www.astraportrait.com` are served by the `astra-alpha` Vercel project from `main`. Composer also deploys from `main`. The historical `alpha.astraportrait.com` domain follows the explicitly configured `alpha` branch preview; it is a second live surface, **not a safe development sandbox**. Its branch-specific database credentials must not be copied into ordinary previews.

UI deployment builds application code. It does not copy, sync, reset, seed, or replace customer rows. The live database is the existing Neon `astra_alpha_20260716` database. Customer records are the source of truth; do not upload local fixture data over them. Schema evolution uses reviewed additive migrations; content imports need explicit ownership-aware append/upsert behavior, never wholesale replacement.

`ASTRA_EXPECTED_DATABASE_TARGET` pins the exact `hostname/database` in Vercel Production. Missing or mismatched configuration fails closed. This is independent of secret database credentials. Both Astra and Composer have the pin.

Hosted seed/reset operations are refused at the repository function boundary and the command boundary, including when `ASTRA_ALLOW_DB_RESET=1` is set. The actual client connection host is checked in addition to the environment. These guards prevent accidental operational use; someone holding database credentials can still issue SQL directly, so this does not replace careful credential handling.

## Back up, migrate, verify

Use the approved live secret source in the operator shell; never print database URLs. No migrations, seeding, resets, or imports belong in Vercel build/start commands. Never run schema push against live data.

```sh
PG_DUMP_BIN=/opt/homebrew/opt/postgresql@17/bin/pg_dump npm run db:backup -- .astra-exports/backups/before-change.dump
ASTRA_LIVE_MIGRATION_CONFIRM='<exact-host>/<exact-database>' ASTRA_LIVE_BACKUP_PATH='.astra-exports/backups/before-change.dump' npm run db:migrate
```

The archive and its manifest are owner-only, excluded from Git, and sensitive. The manifest records a consistent-snapshot checksum and table fingerprints without report text. The migration runner checks the archive hash, exact target, freshness, and pending SQL. It blocks destructive/data-rewriting SQL; such changes require a separate preservation and recovery review. This is a conservative operational guard, not a general SQL proof system. Local migrations remain straightforward.

Before promoting a deployment, retain the pre-change backup and verify saved report continuity using `npm run alpha:verify-report-continuity`. Compare pre/post report and chart fingerprints, account/Ally counts, and the rendered authenticated Library/admin views. Legitimate writes during a deployment may change mutable profile timestamps; investigate differences rather than overwriting them from a backup.

Restore into a separate database to test an archive. Never restore over the live database while users are writing. A Vercel code rollback must keep the current database; it must not restore an old data snapshot. Neon history-retention configuration is not independently verified here; do not assume a particular recovery window. The tested private local archive is the established recovery artifact for this change.

## Owner notices

- Recipient: configured only in Production using `ASTRA_OWNER_NOTIFICATION_EMAIL`.
- Schedule: every five minutes, defined in `apps/astra-web/vercel.json`.
- Endpoint: `GET /api/cron/owner-notifications`; requires `Authorization: Bearer <CRON_SECRET>`. No data is returned to anonymous callers.
- Astra's Vercel Root Directory is `apps/astra-web`, Build Command is `npm run build`, Output Directory is `.next`, with sources outside the root enabled. This keeps its cron configuration out of the separate Composer deployment.
- A transactional database outbox records successful sign-ins and first completed reports. Login events survive sign-out. Failed reports do not notify. Replaying/completing the same report again does not send another notice.
- Admin activity is suppressed; customer activity is notified. A `test` event is an explicit operator delivery test.
- Notices identify the account and report type/ID, with an authenticated admin link. They omit birth details and private report prose. No customer data is made public.
- Preview invocations cannot send owner notices. The queue has one event key, a renewable claim, persisted attempts, and delayed retries. Overlapping invocations cannot claim the same event. A crashed invocation becomes retryable after five minutes. Five events are processed per invocation; a surge creates a visible backlog and delivery delay.
- Resend receives an idempotency key; its deduplication window is finite (24 hours). Delivery is at least once, with rare duplicates possible after an ambiguous provider response beyond that window. Provider acceptance is distinct from inbox arrival.
- The outbox begins at migration installation; it does not email historical activity.

Monitor unsent counts/oldest age in `owner_notifications` and Vercel cron/error logs. No model is used for detection or delivery. Vercel does not automatically retry failed cron calls; persisted events are picked up by the next scheduled invocation.

## Validation and release evidence — November 9, 2026

The original live-site sign-in failure reported PostgreSQL `42P01` for the missing `verification` table. The approved alpha database did contain that table and existing customer records. Reapplying its verified connection to Production and rebuilding the same previously deployed code restored email OTP and authenticated admin access, without migrating or replacing customer data. Tony signed in through the in-app browser; the Admin Console displayed existing accounts and reports.

Baseline: 16 users/profiles, 17 Allies, 34 chart requests, 33 chart results, 72 report requests, 71 report results, 20 artifacts, 28 ledger entries. This is evidence of retained current data, not proof that no historical record was ever lost.

A full pre-change PostgreSQL 17 archive was made and restored into an isolated local validation database. The machine's local PostgreSQL 16 server rejected only PostgreSQL 17's `SET transaction_timeout = 0`; the remaining restore completed and the restored 71 reports were verified. A second consistent-snapshot archive and checksum manifest preceded the additive outbox migration. Neither archive contains generated notification fixtures.

Tests cover login/report triggers, no failed-report notice, deduplication, sign-out survival, concurrent claims, failed-send backoff/recovery, preview isolation, omission of report/birth content, remote reset/seed refusal despite the legacy override, and wrong production database identity refusal. Production-build HTTP checks prove unauthenticated/wrong-secret cron requests return 401, a valid-secret request succeeds, logged-out sessions stay null, and `/admin` redirects to login. Lint (one pre-existing unused-variable warning), typecheck, foundation checks, email configuration checks, and production build passed.

No user-facing layout, copy, navigation, analytics event, or product design pattern changed; visual-pattern acceptance is N/A. The affected boundary is a private operational email and authenticated cron endpoint. Rendered evidence is the recovered real admin sign-in; no customer report was generated or charged for this QA. Private archives, credentials, and detailed account-attribution evidence remain local and are not committed.

## Signup exposure

Public verified-email signup currently grants 30 beta Stars per account, once per user. This is not a global cost cap, invitation gate, or per-person guarantee. Disposable emails can obtain separate accounts. Login/report notices improve visibility but do not constrain report spend. Tony is choosing the access policy separately; do not silently change eligibility or remove existing testers.
