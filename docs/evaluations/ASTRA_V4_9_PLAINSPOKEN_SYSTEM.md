# Better writing, not a custom rewrite for Tony

## Product result

V4.9 changes the Personal and Life Chapter writing system. The goal is warm, plainspoken good sense: a reader should feel recognized and see something useful, without studying layers of psychological explanation. No particular person's edited report is supplied as a template.

### What changes for every new V4 reading

- **Each idea gets one home.** Before drafting, the writer gives each chapter a distinct observation, supporting evidence and contribution. It compares those purposes and removes overlap before producing prose.
- **A shorter complete reading is allowed.** The previous 1,400–1,800-word target and 1,050-word minimum encouraged expansion. Life Chapter now aims at 750–1,100 words; Personal at 900–1,300. The broad technical allowance is 650–2,200. Length does not excuse missing substance, and the upper bound is not a target.
- **Life Chapter becomes usable.** Supported themes lead to recognizable situations and modest things a reader could try, ask, notice or change. No mandatory homework paragraph, major-life-decision prescription, or generic productivity checklist.
- **Personal remains a portrait.** It shares the plain language and nonrepetition rules without being forced into an action plan.
- **The existing editor checks across chapters.** It looks for the same idea wearing different words, rather than just polishing each sentence in isolation. It must not replace direct language with clever but confusing metaphors.
- **The existing reviewer checks reader burden.** Repeated conclusions and pervasive abstraction matter even when the reading-grade number looks good. Brief callbacks and ordinary near misses remain acceptable; no new zero-tolerance phrase gate.

The chart calculation, selected evidence, private support, privacy route, models and call limits are unchanged. Synastry is unchanged by this particular patch. No new paid editing stage was added. The change is local, not deployed, and saved reports are untouched.

## Why this fixes a system pressure

The reported Life Chapter repeated work-versus-recognition across four sections. That exposed a general problem: the old instructions combined a single connective theme, inward psychological explanation, an unresolved-tension ending and a substantial minimum length. Merely replacing long words could leave the same argument repeated in simpler sentences. V4.9 changes planning, length pressure, drafting direction and review together, without replacing the report architecture.

Topic selection stays evidence-led. No assumption that every reader has work, approval, ambition or intimacy issues enters the contract. Offline tests use unrelated friendship, hobby and solitude contexts and confirm those inputs remain intact, the same general rules apply, and no Tony/Cheyenne/Donna example prose appears in the prompts.

## Verification and limits

- `npm run test:portraits-v4`: passed; Personal/Life dispatch, writer/editor/reviewer contract propagation, different reader contexts, 649/650 and 2200/2201 word boundaries, privacy, source-frame handling, call limits and budget/inspection fixtures.
- `npm run test:portrait-prose`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with the existing unrelated `_staleNote` warning.
- `npm run build`: passed.
- `node --env-file=/Users/tony/Documents/Projects/Astra/apps/astra-web/.env.local /tmp/portraits-v4-qa.mjs npm run test:e2e:all -- portraits-v4.spec.ts synastry-v3-production.spec.ts --output .astra-exports/portraits-v4/plainspoken-system-v4-9/browser-qa`: **9/9 passed**. Automated local Better Auth sessions on the isolated QA database; desktop/tablet/mobile report ordering, gifted-Star debit, failure retry without double charge, immutable reader, private evidence and public-share suppression. Screenshot artifacts retained. Model keys blank; these tests verify product plumbing, not real generated writing.

These checks prove implementation and product-path behavior, not literary reliability. No new paid model calls were made in this turn. The hand-edited private Tony sample created before the owner clarified scope is not acceptance evidence for V4.9 and is not fed back into the generator. A later fresh multi-reader sample must test the changed writer itself, without hand polishing, before claiming consistently better generated prose.

## Steward review

Actual runtime/test diff reviewed: one shared V4 reader-experience contract is used at all three existing stages; topic-specific behavior is conditional on report type; no private copy is imported. Broader word allowance is paired with existing whole-report completeness review rather than declared a literary pass. Scope is bounded to V4 Personal/Life; no model substitution, deployment, saved-data mutation or extra call stage. Decision: **accept-with-notes for local implementation; generated-quality improvement remains unverified**.

Next owner decision: judge a small set of fresh, unedited outputs from varied readers—not another bespoke edit of Tony's example.
