# Astra Clean Rebuild Inventory

## Keep As-Is

- `ASTRA_CLEAN_START_INAUGURAL_CHARTER.md` remains the foundational architecture directive.
- Astria branch `codex/astra-v2-better-auth-drizzle-neon` remains the best quarry for auth/data direction.
- Existing Astria visual language and route names are useful references only; they are not copied wholesale.

## Extract Into Modules

- Chart calculation and report generation are future extraction candidates for `packages/astrology` and a later report module.
- Stream card contract ideas from Astria should be extracted only through `packages/contracts`.
- Composer publishing concepts should become explicit contracts before any Composer runtime is implemented.

## Rewrite Cleanly

- Authentication is rebuilt with Better Auth.
- Database schema is rebuilt with Drizzle and Postgres tables owned by `packages/db`.
- Seed data is clean, typed, and resettable.
- Astra web is rebuilt as a small reader shell with Journey, Allies, Self, Library, and Gifts.

## Delete / Archive

- No Supabase client wrappers, environment variables, RLS policies, role assumptions, request-time schema bootstrap, or compatibility shims cross into this repo.
- Old route trees, historical PNGs, admin workflows, campaign machinery, and Composer internals stay in Astria unless they later earn a typed contract.
