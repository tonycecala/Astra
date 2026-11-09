# Public alpha signup cap

Owner decision, November 9, 2026: keep signup public, admit **five new accounts per calendar day**, and preserve all existing tester access. The day resets at midnight in `America/Chicago`, including daylight-saving changes. This is a new-account admission limit, not a dollar budget, concurrent-user limit, or per-person identity check.

## Behavior

- Anyone can visit public pages. Up to five new account records may be committed each Central day.
- Existing users can request a code, verify it, and use their accounts even after the cap is full. Their logins and report generation do not consume signup places.
- New users at capacity see: “Today’s alpha signup places are full. Please try again after midnight Central time. Existing Explorers can still sign in.” The existing form retains their email address.
- Sending a code does not reserve a place. If the final place is taken before a code is verified, verification returns the same clear 429 response and does not create an account, profile, session, or signup Stars.
- OTP and email/password creation are covered. The database rule also covers older app deployments or direct adapter writes.
- Failed/rolled-back account creation does not consume a place. Deleting an admitted account does not refund a place. Occupancy persists across deployments and restarts.
- No public account list, birth details, or report content is exposed. Slot history stores only dates, slot numbers, and opaque user IDs.

## Implementation and operation

Migration `0013_public_signup_cap` creates `signup_policy`, `daily_signup_slots`, and an AFTER INSERT trigger on `user`. A unique day/slot constraint arbitrates concurrent admissions without a count-then-insert race. A full day raises `ASTRA_SIGNUP_DAILY_LIMIT`, rolling back the attempted account insert. The migration briefly locks user writes while installing the rule and includes account creations already committed today; no existing account is edited. There were no signups today at installation.

`signup_policy` is the authoritative configuration: row `public-alpha`, `daily_limit=5`, `time_zone=America/Chicago`. It is database-backed rather than an environment flag, so all application instances sharing this live database enforce the same limit. Changing the limit is an explicit operational decision; do not reset or remove occupancy to create extra places. Future days require no job or model call.

`lib/auth/signup-cap.ts` supplies a helpful pre-send check and translates the authoritative database rejection into HTTP 429, including inside adapter transactions. Better Auth runs email-send callbacks in the background, so enforcement is deliberately **not** placed in that callback. The dictionary owns the interface message. No new client component, route, control, layout, or dependency was added.

Read-only operator check:

```sql
SELECT p.daily_limit, p.time_zone,
  (now() AT TIME ZONE p.time_zone)::date AS signup_day,
  (SELECT count(*) FROM daily_signup_slots s
   WHERE s.signup_day = (now() AT TIME ZONE p.time_zone)::date) AS used
FROM signup_policy p WHERE id = 'public-alpha';
```

The production backup before installation is private at `.astra-exports/backups/pre-signup-cap-2026-11-09.dump`, with its checksum/fingerprint manifest. Deployment rollback does not remove the cap, restore the database, delete slots, or modify existing accounts. The earlier operational protections and notification cron remain in effect.

## Acceptance evidence

- Isolated PostgreSQL tests competed 20 new users for four remaining places: exactly four committed. No rejected user was retained.
- Verified rollback releases a place; account deletion does not. Verified prior-day occupancy does not count today, Central midnight boundaries, and the March DST transition.
- Real Better Auth handler tests verified new OTP requests and password signup return 429 at capacity; existing email OTP verification succeeds with a session cookie. A code issued before capacity cannot create a sixth account afterward.
- Direct internal adapter and transaction-adapter tests verified the same readable 429 translation, preventing alternate creation paths from bypassing the rule.
- The production build ran against an isolated test database. In the in-app browser, a new visitor saw the full-day message with their email preserved. The message rendered at desktop 1440×900, phone 390×844, and tablet 820×1180. An existing fixture requested and verified its code at capacity and reached authenticated `/self` with its Stars intact. No real customer was used for this UI test.
- Browser error/warning review was empty on the settled sign-in page. Lint (one existing unrelated unused-variable warning), typecheck, foundation checks, i18n check, production build, and the mechanical design check passed.

## Product pattern acceptance

Outcome: keep public discovery open while limiting free alpha-account issuance, without interrupting existing Explorers.

Patterns: `patterns/20-fail-safe.md` for preserving existing access and giving a recovery path; `patterns/31-limited-offer.md` for truthful, actual capacity. The capacity is real and database-enforced; there is no countdown, upsell pressure, fake scarcity, or collection of extra personal data. Mobbin’s Aboard signup error screen was used only as a structural reference for retaining form input and showing a readable inline explanation: https://mobbin.com/screens/e3e7c4d1-e89e-4586-9762-07944e809cb7.

Logged out: public pages and signup remain available. Empty/new day: five places. Loading: existing working indicator. Success: existing OTP/session path. Error/full: localized message with next-day recovery; existing email can still sign in. Boundary/race/error states are covered by the tests above.

File-to-criteria mapping: `signup-cap.ts` and `auth/server.ts` preserve access and translate capacity errors; `i18n.ts` supplies user-focused copy; schema/migration enforce genuine scarcity and atomic rollback; `smoke-signup-cap.mts` verifies concurrency and alternative paths. No layout or navigation change. Analytics runtime emission is N/A because the app has no pattern-analytics transport; daily occupancy is inspectable through the operator query without adding a tracking system.
