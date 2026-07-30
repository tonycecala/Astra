# Astra Verification Tiers

Use the smallest tier that can disprove the change, then run the release tier before merging changes that affect production behavior. A test is selected by the boundary changed, not by habit.

## Commands and measured cost

Measurements were taken on 2026-07-30 on the local Mac, from a warm dependency install and production build.

| Tier | Command | Scope | Wall time |
| --- | --- | --- | ---: |
| Fast static | `npm run check:fast` | TS7 typecheck, foundation, i18n, architecture boundaries, no-Supabase | 2.50s |
| Cached lint | `npm run lint` | ESLint with persistent cache | 1.45s |
| Full static | `npm run check` | cached lint, fast static, production Next.js build | 11.32s |
| Browser smoke | `npm run test:e2e:smoke` | desktop route, navigation, login-control smoke | 15.24s |
| Auth | `npm run test:e2e:auth` | one real OTP contract plus reused signed sessions | 22.90s |
| Journey | `npm run test:e2e:journey` | Journey navigation, privacy, lifecycle, report handoff | 14.20s |
| Report | `npm run test:e2e:report` | report creation, legacy access, billing/admin, JourneyStep | 15.65s |
| Responsive | `npm run test:e2e:responsive` | tagged desktop/tablet/mobile layout checks | about 49s |
| Rate limit | `npm run test:e2e:rate-limit` | isolated production OTP throttle contract | 2.02s |
| Release | `npm run test:e2e:release` | essential `@release` paths across all projects plus production rate limit | run before merge/release |

The previous unpartitioned E2E run took about 149 seconds and repeatedly exercised the real OTP endpoint until production throttling caused false failures. The new auth suite proves one real OTP delivery and verification, then uses Better Auth's signed test-session utility for authenticated product journeys. Production auth code and rate limiting are unchanged.

## Change-to-test decision matrix

| Change boundary | During development | Before merge |
| --- | --- | --- |
| Docs or comments only | targeted doc validation | `git diff --check` |
| Type-only, pure module, schema contract, i18n dictionary | `npm run check:fast` | `npm run check` |
| ESLint/config/import boundary | `npm run lint` plus the affected focused check | `npm run check` |
| Route rendering, navigation, public/private redirect | `npm run test:e2e:smoke` | `npm run check` and affected browser group |
| Login, session, user/profile binding | `npm run test:e2e:auth` | auth plus rate-limit; release for shared auth infrastructure |
| Journey ordering, actions, privacy, recovery | `npm run test:e2e:journey` | journey plus responsive if layout changed |
| Report generation, Library, billing, admin | `npm run test:e2e:report` | report plus auth when identity or billing changed |
| CSS, navigation layout, breakpoints, touch behavior | affected desktop test while iterating | `npm run test:e2e:responsive` |
| Email OTP or abuse controls | auth during iteration | `npm run test:e2e:auth` and `npm run test:e2e:rate-limit` |
| Shared runtime/config/dependency, cross-boundary refactor, release candidate | focused tier first | `npm run check` and `npm run test:e2e:release` |

## Determining factor

Always run E2E when a change can only be proven through a rendered browser, a real route transition, browser-held session state, a public/private boundary, or a multi-step user journey. Do not run every viewport for server-only or copy-neutral changes. Responsive E2E is required when DOM structure, CSS, navigation, viewport behavior, or interactive placement changes.

Focused script checks remain useful when they own a contract not represented in Playwright. They are not automatically required merely because they exist. Select them when the changed file appears in the script's inputs or the change affects the behavior named by that script.

## Security boundary

- Production auth defaults and endpoint behavior remain unchanged.
- The exhaustive Playwright server alone sets `ASTRA_E2E_DISABLE_AUTH_RATE_LIMIT=1` so harmless session reads cannot exhaust Better Auth's global window. Rate limiting remains enabled by default and in the isolated production contract.
- One `@auth` test sends and verifies a real OTP through the configured test delivery adapter.
- Other authenticated tests create correctly signed Better Auth sessions directly in the test process; no browser-accessible test-login route exists.
- `test:e2e:rate-limit` starts a separate production server on port 3013 and proves the fourth OTP request is rejected with HTTP 429.
- File email capture is local E2E infrastructure. Production delivery selection and production secrets remain unchanged.

## Tagging contract

Use one or more of `@smoke`, `@auth`, `@journey`, `@report`, `@responsive`, and `@release` in each Playwright title. `@release` identifies essential cross-product acceptance paths. Do not add it to every test; it is reserved for a compact release signal. Tests that deliberately sweep their own viewports should skip duplicate tablet/mobile projects.
