# Astra Weekend Alpha Launch

## Target

- URL: `https://alpha.astraportrait.com`
- Git branch: `alpha`
- Vercel projects: `astra-alpha` and `composer-alpha`, both pinned to `alpha`
- Data: isolated `astra_alpha_20260716` database in Neon
- Email: Resend from a verified `astraportrait.com` sender
- Payments: disabled; new alpha accounts receive beta Stars
- Logged-out home: four public cards retrieved from Composer, with Astra seed fallback

## Human Authorization Checkpoints

Tony is needed only for these account-level actions:

1. Create the private GitHub repository and authorize the push destination.
2. Sign in to Vercel, authorize its GitHub connection, and import the repository.
3. Verify the Resend sender domain if it is not already verified.
4. Approve the Vercel and Cloudflare domain connection for `alpha.astraportrait.com`.

## Vercel Projects

Connect the Git repository twice as separate monorepo projects. Both projects use `alpha` as their Production Branch; their Production variables are therefore isolated to this dedicated branch and never reach Astraea or Astra `main`.

For `astra-alpha`:

- Root Directory: repository root
- Framework: Next.js
- Build Command: `npm --workspace apps/astra-web run build`
- Output Directory: `apps/astra-web/.next`
- Production Branch: `alpha`
- Domain: connect `alpha.astraportrait.com` to this project's Production deployment

For `composer-alpha`:

- Root Directory: repository root
- Framework: Next.js
- Build Command: `npm --workspace apps/composer-web run build`
- Output Directory: `apps/composer-web/.next`
- Production Branch: `alpha`
- No public custom domain is required; Astra uses `https://composer-alpha-astra-labs.vercel.app`
- Public routes: `/api/library/availability` and `/api/status`
- Operator UI and mutation APIs: locked behind `ASTRA_INTERNAL_API_TOKEN`

Do not attach the alpha domain to an arbitrary commit URL. It must follow the newest successful Production deployment from `alpha`.

## Isolated Database

Use the dedicated `astra_alpha_20260716` Neon database created for this alpha. It shares no tables or records with the existing `neondb` databases. Never reuse the local database URL and do not point alpha at an existing production database.

With the alpha database URL available only in the current shell:

```bash
ASTRA_DATABASE_URL='postgresql://...' npm run db:migrate
```

Composer's public sample is repository-backed, so the private alpha database begins empty. Every signed-in alpha user receives the configured one-time beta Stars grant.

### Report Continuity Proof

Before and after any production redeploy, verify one completed private report against the same isolated alpha database. This fingerprints the saved report content and immutable report-basis snapshot without printing prose to the terminal. Add `--export-markdown` only when a private local review copy is needed; the export is written with owner-only permissions.

```bash
ASTRA_ALPHA_CONTINUITY_CONFIRM=alpha.astraportrait.com \
ASTRA_DATABASE_URL='postgresql://...' \
npm run alpha:verify-report-continuity -- \
  --request-id '<completed-report-request-id>' \
  --export-markdown .astra-exports/alpha-reviews/<report>.md
```

The pre- and post-deploy fingerprints must match. Do not rely on a local `vercel env run` invocation as database evidence unless its injected environment has been independently verified; use the approved alpha secret source in the operator shell and never print the URL.

## Branch-Scoped Variables

Set these on `astra-alpha` for Production. The project tracks only Git branch `alpha`:

```text
ASTRA_DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL=https://alpha.astraportrait.com
NEXT_PUBLIC_SITE_URL=https://alpha.astraportrait.com
ASTRA_INTERNAL_API_TOKEN
ASTRA_EMAIL_DELIVERY=resend
ASTRA_EMAIL_FROM=Astra <hello@VERIFIED_ASTRAPORTRAIT_DOMAIN>
RESEND_PROD
ASTRA_BETA_SIGNUP_CREDITS=30
ASTRA_PLACE_SEARCH_PROVIDER=local-fixture
ASTRA_EPHEMERIS_ENGINE=local-chart-routine
ASTRA_REPORT_WRITER=debug-model-writer
ASTRA_REPORT_MODEL_PROFILE=production
ASTRA_OPENROUTER_API_KEY
ASTRA_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
ASTRA_ADMIN_ENABLED=1
COMPOSER_APP_BASE_URL=https://composer-alpha-astra-labs.vercel.app
```

Leave `ASTRA_REPORT_MODEL` unset so the production profile resolves to `anthropic/claude-sonnet-5`. Leave `ASTRA_REPORT_MODEL_PROVIDER` unset as well; the production profile resolves it to OpenRouter. Gemini 3.5 Flash remains an explicit admin replay fallback, not an automatic customer-report failover.

Generate fresh alpha-only values for `BETTER_AUTH_SECRET` and `ASTRA_INTERNAL_API_TOKEN`. Do not copy local development secrets. Do not add Stripe variables.

After pulling the branch-scoped environment locally, validate names and behavior without printing secrets:

```bash
npm run check:alpha-env
```

Set these on `composer-alpha` for Production. This project also tracks only Git branch `alpha`:

```text
ASTRA_DATABASE_URL
ASTRA_APP_BASE_URL=https://alpha.astraportrait.com
ASTRA_INTERNAL_API_TOKEN
COMPOSER_REQUIRE_AUTH=1
```

Use the same alpha database URL and the same fresh internal token as `astra-alpha`, then validate:

```bash
npm run check:composer-alpha-env
```

## Preview Builds

Preview deployments are useful for build review, but they are not the alpha runtime environment. Astra's Preview scope needs its own generated `BETTER_AUTH_SECRET`; without it, Next.js fails while collecting the `/_not-found` route. Do not copy the alpha production database or email-delivery credentials into Preview merely to make an interactive preview work. Production alpha remains the acceptance surface.

## First Admin

Tony signs in once through the live alpha. Then promote only that exact email against the alpha database:

```bash
npm run alpha:promote-admin -- astramaster@tony.io
ASTRA_ALPHA_ADMIN_CONFIRM=alpha.astraportrait.com \
  vercel env run -e production -- \
  npm run alpha:promote-admin -- astramaster@tony.io --execute
```

The first command is a dry run. The second uses Vercel's branch-scoped environment and writes only after the explicit alpha confirmation. The command also refuses local database hosts.

## Focused Acceptance Path

1. Open logged-out Home and confirm exactly four public Composer cards render with media.
2. Confirm Composer operator UI and mutation APIs reject anonymous requests.
3. Stop Composer temporarily and confirm logged-out Home falls back to Astra seed cards.
4. Request and receive a real email sign-in code.
5. Confirm the signed-in account receives beta Stars exactly once.
6. Enter Self birth details and create a chart.
7. Add an Ally and create an Ally chart.
8. Generate an Identity report using the production model profile.
9. Confirm the Library report and provenance show the chosen Zodiac and Houses.
10. Confirm Journey, Allies, Self, Library, and Gifts render on a phone viewport.
11. Confirm checkout is unavailable without disrupting report ordering with granted Stars.
12. Review browser console and Vercel function logs for auth, database, email, report, and Composer errors.

## Rollback

- Roll back the domain to the last successful `alpha` deployment in Vercel.
- If data behavior is suspect, detach the domain before changing the database branch.
- Never delete the Neon alpha branch during investigation; preserve it for diagnosis.
