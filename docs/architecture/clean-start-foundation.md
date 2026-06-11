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
- Better Auth is wired through a clean route boundary.
- Database schema is Drizzle-owned and contains Better Auth plus Astra-owned tables.
- Composer is visible as a boundary but not implemented.
- Supabase assumptions are rejected by checks and database URL guards.

## Boundaries

- `packages/contracts` defines public nouns.
- `packages/db` owns schema/client.
- `apps/astra-web` renders product routes and owns auth integration.
- `packages/testkit` owns seed fixtures and test factories.
- Composer and astrology do not leak into Astra runtime.
