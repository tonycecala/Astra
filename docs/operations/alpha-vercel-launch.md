# Astra Weekend Alpha Launch

## Target

- URL: `https://alpha.astraportrait.com`
- Git branch: `alpha`
- Vercel environment: Preview, pinned to the `alpha` branch
- Data: isolated Neon alpha branch
- Email: Resend from a verified `astraportrait.com` sender
- Payments: disabled; new alpha accounts receive beta Stars

## Human Authorization Checkpoints

Tony is needed only for these account-level actions:

1. Create the private GitHub repository and authorize the push destination.
2. Sign in to Vercel, authorize its GitHub connection, and import the repository.
3. Sign in to Neon and authorize creation of the isolated alpha database branch.
4. Verify the Resend sender domain if it is not already verified.
5. Approve the Vercel and Cloudflare domain connection for `alpha.astraportrait.com`.

## Vercel Project

Import the Git repository as a monorepo project with:

- Root Directory: `apps/astra-web`
- Framework: Next.js
- Include source files outside Root Directory: enabled
- Production branch: leave the repository default unchanged
- Alpha: deploy `alpha` as a Preview branch
- Domain: connect `alpha.astraportrait.com` to Preview, Git branch `alpha`

Do not attach the alpha domain to an arbitrary commit URL. The branch alias must follow the newest successful `alpha` deployment.

## Isolated Database

Create a Neon branch dedicated to this alpha. Never reuse the local database URL and do not point alpha at an unrelated production database.

With the alpha database URL available only in the current shell:

```bash
ASTRA_DATABASE_URL='postgresql://...' npm run db:migrate
ASTRA_DATABASE_URL='postgresql://...' npm run db:seed -- --execute
```

The seed establishes public Journey cards. Every signed-in alpha user receives the configured one-time beta Stars grant.

## Branch-Scoped Variables

Set these on Vercel for Preview, restricted to Git branch `alpha`:

```text
ASTRA_DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL=https://alpha.astraportrait.com
NEXT_PUBLIC_SITE_URL=https://alpha.astraportrait.com
ASTRA_INTERNAL_API_TOKEN
ASTRA_EMAIL_DELIVERY=resend
ASTRA_EMAIL_FROM=Astra <hello@VERIFIED_ASTRAPORTRAIT_DOMAIN>
RESEND_PREVIEW
ASTRA_BETA_SIGNUP_CREDITS=30
ASTRA_PLACE_SEARCH_PROVIDER=local-fixture
ASTRA_EPHEMERIS_ENGINE=local-chart-routine
ASTRA_REPORT_WRITER=debug-model-writer
ASTRA_REPORT_MODEL_PROFILE=production
ASTRA_OPENROUTER_API_KEY
ASTRA_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
ASTRA_ADMIN_ENABLED=1
```

Generate fresh alpha-only values for `BETTER_AUTH_SECRET` and `ASTRA_INTERNAL_API_TOKEN`. Do not copy local development secrets. Do not add Stripe variables.

After pulling the branch-scoped environment locally, validate names and behavior without printing secrets:

```bash
npm run check:alpha-env
```

## First Admin

Tony signs in once through the live alpha. Then promote only that exact email against the alpha database:

```bash
npm run alpha:promote-admin -- astramaster@tony.io
ASTRA_ALPHA_ADMIN_CONFIRM=alpha.astraportrait.com \
  vercel env run -e preview --git-branch alpha -- \
  npm run alpha:promote-admin -- astramaster@tony.io --execute
```

The first command is a dry run. The second uses Vercel's branch-scoped environment and writes only after the explicit alpha confirmation. The command also refuses local database hosts.

## Focused Acceptance Path

1. Request and receive a real email sign-in code.
2. Confirm the signed-in account receives beta Stars exactly once.
3. Enter Self birth details and create a chart.
4. Add an Ally and create an Ally chart.
5. Generate an Identity report using the production model profile.
6. Confirm the Library report and provenance show the chosen Zodiac and Houses.
7. Confirm Journey, Allies, Self, Library, and Gifts render on a phone viewport.
8. Confirm checkout is unavailable without disrupting report ordering with granted Stars.
9. Review browser console and Vercel function logs for auth, database, email, and report errors.

## Rollback

- Roll back the domain to the last successful `alpha` deployment in Vercel.
- If data behavior is suspect, detach the domain before changing the database branch.
- Never delete the Neon alpha branch during investigation; preserve it for diagnosis.
