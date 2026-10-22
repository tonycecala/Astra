# Portraits V4 — local engineering review

Status: **accepted with notes for local owner review**, September 18, 2026. All planned writing observations and local checks complete. No deployment or push authorized.

## Product and boundaries

Personal replaces new Identity/Core/Deep ordering at 10 gifted Stars. Relationship stays 10; Life Chapter stays 5. Saved historical types remain readable and their Library filters normalize to Personal. The new API rejects retired purchase choices before any debit. Existing calculation and evidence selection remain the source of the writing; the successful Relationship writer is preserved.

V4.7 writes a complete psychological portrait, applies a bounded exact-span edit, then checks material problems. Minor narrative-origin matches are private advisories, not automatic rewrites. The whole-report independent reader uses owner-authorized review V2. The Life Chapter editor/gate explicitly preserves natal-versus-progressed participant identity after a material first-cohort failure; its bounded repair and separate fresh confirmation both passed. Completed saved reports are returned unchanged on reopen/retry. A failed generation can retry its saved request without spending additional Stars. There is no deterministic/default-prose substitute for V4, including synchronous callers or an unqualified alternate provider route.

## Actual-diff review

Reviewed the changed contracts, production dispatch, selected-evidence serialization, provider adapter, generation API, retired-order guard, three-product catalog, ordering component, reader/private support, Library filters, Stars labels, i18n and CSS. Reviewed the new engine, spend ledger and offline-inspector implementation; the inspector received a second pass for Synastry and missing/malformed artifacts. No schema migration or production data mutation. Private evidence remains outside the visible/public signal and shared-reader support.

React checklist: report actions remain event-driven, state updates preserve existing arrays, in-flight retry is disabled, labels and native radios/details remain keyboard-accessible, and no new client data fetching or heavy bundle dependency was introduced. The finished-state caption was corrected so a failed report does not continue to say generation is in progress.

Source navigation: local REPOMAP and targeted source/diff were used; JCodeMunch reported this isolated worktree unindexed. No broad reindex or unrelated governance repair was performed in a dirty working tree.

## Validation receipts

- `npm run test:portraits-v4`: production schema-2 dispatch, selected evidence, model stages/private route, exact editing, failure bounds, advisory-only near miss, no default/alternate-route fallback, prices; spend-cap/refusal/resume/lock fixtures; offline run-inspector fixtures. Synthetic prose proves mechanics, not writing quality.
- `npm run test:report-model-strategy`: passed after default routing and stage-model changes.
- `npm run typecheck`: passed.
- `npm run lint`: zero errors; pre-existing `_staleNote` warning in `repair-imported-ally-contexts.mts` left alone.
- `npm run build`: production build passed after the final V4.7 source-frame and retry-state changes.
- `npm run test && npm run check:i18n && npm run check:boundaries && npm run check:no-supabase`: passed. Together with the recorded lint/typecheck/build, these execute every component of the repository's `check` script.
- Isolated local QA wrapper: `node --env-file=/Users/tony/Documents/Projects/Astra/apps/astra-web/.env.local /tmp/portraits-v4-qa.mjs <command>`. It verifies a localhost DB, selects `astra_portraits_v4_qa`, blanks model keys, and starts production servers on 3044/3045. No canonical local or hosted user data writes.
- `npm run test:e2e:smoke` through that wrapper: 12 passed. Public/auth-redirect route classes `/`, `/journey`, `/allies`, `/self`, `/charts`, `/library`, `/gifts`, `/login`, adjacent navigation and login controls; no unexpected console errors.
- `npm run test:e2e:all -- --grep '@portraits-v4|@synastry-v3'` through wrapper: 6 passed, all new Portraits tests on desktop/tablet/mobile. The second grep tag matched no Synastry tests; earlier separate Synastry production coverage passed on all three viewports. Do not claim nine from this six-test command.
- `npm run test:e2e:all -- synastry-v3-production.spec.ts` through wrapper: subsequently 3 passed on desktop/tablet/mobile, including canonical Ally edits and owner/public support suppression. This explicitly verifies the separate unchanged Relationship path.
- Final explicit combined command through the wrapper: `npm run test:e2e:all -- portraits-v4.spec.ts synastry-v3-production.spec.ts --output .astra-exports/portraits-v4/browser-qa`: **9 passed**, desktop/tablet/mobile. Screenshots are retained under that private output directory, including selectors, readers and retry states. The final tablet retry image confirms the corrected ready-to-retry caption.
- New authenticated tests use actual Better Auth-signed local sessions. They cover three choices, conditional partner/date, optional question, cancel without debit, retired type rejection, 10/10/5 debits, preserved completed report, legacy filter, owner-private evidence/public-share exclusion, unauthenticated generation rejection and retry without another charge.
- `git diff --check`: passed at this checkpoint.

Screenshot inspection justification: source and DOM assertions already established choices, prices, privacy and no horizontal overflow. Desktop/mobile selector and tablet retry images were inspected to confirm hierarchy, readable choice cards and reachable actions. This is supplemental visual evidence, not a substitute for automated behavior. Existing wider-page design was preserved rather than redesigned. Reference for simple choice hierarchy: [Mobbin example](https://mobbin.com/screens/31e7e771-e8fc-4f38-a672-062f2474b790).

## Writing result and release boundary

The fixed primary run produced six accepted readings and one material natal/progressed source-role failure. The original primary HOLD is retained. A prospectively bounded correction and an independent fresh confirmation both passed under unchanged V2 review. Both fixed repeat units passed at 4.20 with equivalent accepted quality. The owner review set contains eight accepted readings covering three Personal, three Life Chapter, sibling Relationship and romantic Relationship. Every accepted reading carries editorial notes; acceptance does not mean perfection. Neutral candidate IDs concealed model details where practical, but identity/topic and development or correction status were known. The single independent reviewer is a product-quality endpoint, not population-wide reliability or scientific validity.

All five final cohort folders pass the offline inspector. Review arithmetic and reading/evidence hashes were checked in code for all 12 V2 observations: 11 accepted, one preserved primary HOLD. The private canonical record is `.astra-exports/portraits-v4/FINAL_RESULT.json`; the owner's entry is `.astra-exports/portraits-v4/REVIEW_INDEX.md`. Total actual OpenRouter charges, including failed development and controls, were **$3.534705 / $30** across 104 ledger transactions, with zero unsettled reservations and no live spend lock. No additional paid calls are required.

Tests of model-free UI paths are separate from paid prose evidence. No live Vercel deployment, real payment, external email or saved-report replacement has been attempted; Mailpit was not needed because seeded-session product tests cover this unchanged auth boundary. Host runtime duration and recovery need confirmation before a supervised alpha rollout. Stop at this local-review boundary rather than extending into unapproved deployment.

Known scope limits: the completed-report guard prevents a later retry overwriting a saved reading, but is not a distributed lock for simultaneous first-generation calls. Retry recovery in this patch is in the current ordering session; no claim is made of a new durable background queue. The fixed writing cohort used no optional question; although writer/editor receive it, the gate does not receive that context, so a user-supplied biography may be falsely held. Explicit admin model overrides are not qualified by this default-model study. These remain deployment-readiness considerations, not hidden guarantees in the local review.

## Steward judgment

**Accept-with-notes for the completed local implementation and reviewed writing set.** The actual diff, complete readings, immutable review decisions and validation evidence support this boundary. The patch preserves the core product/evidence architecture and makes topics, versions and proportionate review explicit. No further refinement is warranted by accepted near misses. All 36 changed/untracked paths at the final classification belong to this session or its reviewers; private generated outputs remain ignored. Other worktrees are intentionally left in place, with no merge, push or deletion. The original Astra checkout's unrelated changes are untouched.

The reusable procedure is in the existing verification playbook; a reviewed local warning was captured at `akashic/warnings/report-quality-proof-must-match-the-customer-writing-path.md`. Central bulk ingestion was not performed: a read-only comparison showed it would overwrite 11 unrelated existing import snapshots as well as the intended playbook. Preserve those snapshots; scoped central promotion is a separate maintenance task. Pre-existing governance issues (missing prompt-aware advisory hook, local knowledge directories/frontmatter/placeholders) remain visible in `ak governance check`, `ak doctor` and `ak validate`; the new warning is complete, and no actionable Mail or pending closeout receipt blocked this task. REPOMAP/JCodeMunch were used for navigation, but their old indexes are not claimed to include this new module; no dirty-tree map regeneration was performed simply to make a check green.
