---
title: "TypeScript Native Compiler Validation"
type: "playbook"
description: "Side-by-side TypeScript 7 adoption and reproducible compiler throughput validation."
status: "active"
project: "astra"
created: "2026-07-30"
updated: "2026-07-30"
tags: ["typescript", "typescript-7", "performance", "verification"]
related:
  - "../../docs/evaluations/ASTRA_TYPESCRIPT_7_BENCHMARK.md"
---

# TypeScript Native Compiler Validation

## Goal

Adopt the native TypeScript compiler without breaking tools that still import
the JavaScript TypeScript API, and measure gains against the same source tree.

## Package Layout

Until TypeScript exposes the new programmatic API, keep the compilers
side-by-side:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

Confirm the resolved roles:

```bash
npx tsc --version
npx tsc6 --version
node -e 'console.log(require("typescript").version)'
```

`tsc` should report 7.x. The API import and `tsc6` should report 6.x.

## Procedure

1. Start from a clean worktree and record the baseline commit, machine, Node,
   npm, and compiler versions.
2. Run a fresh `npm ci` before benchmarking. If it fails, record and repair the
   lockfile problem separately from compiler compatibility.
3. Run the current compiler with `--incremental false` at least five times.
4. Install the side-by-side layout. Do not force a direct TS7 replacement past
   peer-dependency warnings.
5. Resolve explicit TypeScript 7 configuration errors. For removed `baseUrl`,
   remove the option and make `paths` values relative with `./`.
6. Prove the migrated configuration under both `tsc6` and `tsc`.
7. Compare `--listFilesOnly` output after excluding dependencies and
   normalizing worktree prefixes. Do not accept a speed gain that silently
   checks less Astra source.
8. Run the TypeScript 7 no-cache benchmark at least five times.
9. Compare repeated unchanged typechecks separately; report the median so one
   cache or scheduler outlier does not dominate.
10. Remove or move `tsconfig.tsbuildinfo` and `.next` from both worktrees, then
    compare cold `npm run check` executions.
11. Run a fresh `npm ci` and the full repo gate one final time.

## Acceptance

- TypeScript 6 and 7 report no source errors.
- Astra-owned file coverage is identical.
- `npm ci` and `npm run check` pass.
- The report separates compiler speed from full-gate speed.
- Next.js and ESLint continue using the supported TypeScript 6 API.
- Memory is reported with its measurement method; mixed evidence is not
  summarized as a guaranteed reduction.

## Rollback

Remove `@typescript/native`, restore the prior `typescript` dependency,
regenerate the lockfile, and run `npm ci && npm run check`. Keep any
compiler-compatible path cleanup that reduces deprecated configuration.
