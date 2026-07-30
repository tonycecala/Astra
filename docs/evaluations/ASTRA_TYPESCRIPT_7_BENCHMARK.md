# Astra TypeScript 7 Benchmark

Date: 2026-07-30
Branch: `codex/ts7-astra-benchmark`
Measured snapshot: `1c5fbf6fe006a2725a91904e3aef894ae202b4a8`
Current validation base: `a1a05c91a916f71d382172877774f72c0c2e2a02`
Machine: Apple silicon, macOS 26.5, Node.js 24.13.0, npm 11.6.2

## Decision

Adopt TypeScript 7 for Astra's explicit CLI typecheck, but keep TypeScript 6
installed side-by-side as the programmatic API used by Next.js and
`typescript-eslint`.

Do not replace the `typescript` package directly with TypeScript 7 yet.
TypeScript 7.0 has no programmatic API, while Astra's current
`typescript-eslint` dependency declares support for TypeScript versions below
6.1. The side-by-side package layout follows Microsoft's TypeScript 7.0
transition guidance:

- `@typescript/native` provides the TypeScript 7 `tsc` binary.
- `typescript` aliases `@typescript/typescript6` for tools that import the API.
- `tsc6` remains available for parity diagnosis and rollback.

## Measured Results

| Check | TypeScript 5.9.3 | TypeScript 7.0.2 | Result |
| --- | ---: | ---: | ---: |
| Full no-cache typecheck, five-run mean | 5.600s | 0.688s | 8.14x faster |
| Repeated unchanged typecheck, five-run median | 1.220s | 0.320s | 3.81x faster |
| Cold `npm run check` | 22.05s | 17.77s | 19.4% faster |
| Compiler-reported memory | 663,709K | 580,165K | 12.6% lower |

The full verification gate saves 4.28 seconds per cold run. The gain is smaller
than the compiler-only result because lint, foundation tests, boundary checks,
and the Next.js production build are separate work. Next.js still loads the
TypeScript 6 API in this transition layout, so its internal `Running
TypeScript` build phase is not a TypeScript 7 benchmark.

Memory evidence is mixed across measurement methods. Compiler-reported memory
fell, and macOS peak memory footprint fell from about 903 MB to 773 MB, but
maximum resident set size was roughly flat/slightly higher (766 MB to 787 MB).
Treat speed as proven and memory improvement as directional, not guaranteed.

## Method

The full no-cache compiler benchmark ran each compiler five times with:

```bash
tsc --noEmit -p tsconfig.json --incremental false
```

The cold workflow comparison moved both `tsconfig.tsbuildinfo` and
`apps/astra-web/.next` out of their worktrees before running:

```bash
npm run check
```

The source-coverage comparison used `--listFilesOnly`, excluded dependencies,
normalized worktree paths, sorted the lists, and found no Astra-owned source
file differences.

## Compatibility Findings

1. A direct TypeScript 7 install produces peer-dependency override warnings for
   `typescript-eslint`; it is not the safe current layout.
2. TypeScript 7 rejects Astra's former `baseUrl` configuration. Removing
   `baseUrl` and making all `paths` targets explicitly relative works under
   both TypeScript 6 and 7.
3. The committed baseline lockfile cannot pass a fresh `npm ci` because
   `@emnapi/wasi-threads` is locked at 1.2.2 while the dependency tree requires
   1.2.3. Regenerating the trial lockfile repairs that pre-existing mismatch.
4. The side-by-side trial passes a fresh `npm ci`, lint, TypeScript 7
   typecheck, foundation checks, dependency boundaries, the no-Supabase guard,
   and the Astra production build.
5. No browser or customer-runtime behavior changes. This is a developer
   verification-throughput upgrade.
6. After the concurrent Journey curation and legacy-onboarding retirement work
   landed, the trial branch was rebased to the latest clean commit and
   revalidated. TypeScript 6/7 parity, Astra-owned
   source coverage, `npm ci`, `npm run check`, and
   `npm run test:journey-curation` all passed on the current base.

## Normal Development Session

The first normal `alpha` development session after adoption moved remaining
Astra interface chrome into the i18n dictionary and added a static i18n chrome
guard to the full check.

| Post-edit check | First run | Final exact-diff run | Result |
| --- | ---: | ---: | --- |
| `npm run typecheck` | 0.63s | 0.94s | pass |
| `npm run check` | 17.77s | 17.47s | pass |

- TypeScript 7 CLI typechecking remained clean.
- ESLint reported no errors or warnings.
- Next.js 16.2.9 compiled successfully. Its TypeScript 6 API phase emitted the
  existing project-reference limitation warning and completed in 4.3s.
- No editor issue was observed in this terminal/browser session; editor
  extension behavior was not directly instrumented.
- Rendered desktop/mobile login, logged-out Library, and the `/admin` private
  redirect were clean with no console warnings/errors or horizontal overflow.

## Rollback

Restore `typescript` to the prior 5.x declaration, remove
`@typescript/native`, regenerate the lockfile, and retain the relative
`paths` configuration. The configuration cleanup is compatible with the old
compiler and does not need to be reverted.
