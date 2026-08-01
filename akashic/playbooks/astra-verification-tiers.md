---
title: "Astra Verification Tiers"
type: "playbook"
description: "Select fast, focused, responsive, security, and release verification by changed boundary."
status: "active"
project: "astra"
updated: "2026-07-31"
tags: ["verification", "playwright", "performance"]
---

# Astra Verification Tiers

## Purpose

Keep feedback fast without weakening the proof required at production boundaries.

## Procedure

1. Identify the changed boundary using `docs/evaluations/ASTRA_VERIFICATION_TIERS.md`.
2. Run `npm run check:fast` for the normal edit loop.
3. Run the one affected Playwright group when browser behavior is in scope.
4. Run `npm run check` before committing broad or production-boundary executable changes. Do not treat every executable edit as release work.
5. Run `npm run test:e2e:release` before merging shared runtime, authentication, cross-route, or release-candidate changes.
6. Keep the OTP rate-limit suite isolated because proving the throttle intentionally exhausts its production window.

## Authenticated browser tests

Prove the real OTP contract once. Reuse Better Auth-signed test sessions for product journeys so authentication remains realistic without repeatedly consuming rate-limit capacity. Never expose a test-login API route and never disable production throttling.

## Review

Record the selected tier and why in closeout. If a relevant tier was omitted, state the boundary evidence that made it unnecessary.

## Branch and worktree closeout

Tony should not need to reconstruct Git history to know whether work is safe. At every implementation closeout:

1. List all worktrees and classify each branch as active, merged, or intentionally parked.
2. Commit coherent owned work before switching integration contexts; never leave completed changes as unexplained worktree dirt.
3. Before merging an old branch, prove whether its committed or uncommitted result is already present in the target. Use ancestry plus a path-scoped tree comparison, not commit messages alone.
4. If the old result is byte-identical to an existing target commit and the target has since evolved, preserve the newer target tree and record a history-only merge. Do not replay the old patch over newer refactors.
5. Merge unique work into the current shared branch, resolve against current contracts, and run only the checks justified by the resulting tree diff.
6. Finish with clean worktrees, an ancestry audit, and a concise list of any branches that remain intentionally active. Push only when Tony has authorized it.

Verification must be proportional to the changed boundary and the claim being made:

- Documentation, comments, copy, and other non-executable edits usually need only diff inspection and format or link checks relevant to the file.
- Small, isolated logic edits usually need targeted lint, typecheck, and the affected test—not an automatic full-repository build or browser sweep.
- Tests and private experiments should prove the experiment harness, fixtures, assertions, privacy boundary, and observed result. They do not require production verification when they do not change production behavior.
- CSS and visual-only edits need fast rendered-browser inspection at the affected viewport plus a targeted smoke check. Save broad lint, typecheck, build, and route sweeps for settled checkpoints or when the edit crosses component, navigation, accessibility, or responsive-layout boundaries.
- Full `npm run check`, production build, release E2E, and broad route verification belong to shared runtime, contracts, auth, persistence, public/private boundaries, cross-route behavior, release candidates, or any change whose blast radius is genuinely broad.

More verification is not automatically more responsible. Choose the smallest evidence set that can falsify the likely failure, and escalate only when the changed boundary or failed evidence justifies it.

For durable state transitions, first prove the action acknowledgement, then reload before asserting the persisted result. Do not make release acceptance depend on client revalidation timing.

When one reader component serves both owner and public-share routes, treat hidden owner detail as a public/private boundary rather than a presentation toggle. Suppress private Evidence, trace IDs, and internal review notes in shared mode, then assert that the logged-out shared HTML and response payload do not contain them.

## Private shadow-generation bakeoffs

Use a private shadow-generation bakeoff when the question is editorial or model-behavioral and does not require a product-path change.

1. Read saved source records without inserting or updating production data.
2. Require an explicit `--generate` flag and pin the current approved writer.
3. Duplicate every production provider control that affects output, including temperature and reasoning effort. Record any intentional scope-driven difference, such as a larger completion-token limit for a longer experimental structure; never omit a provider control silently.
4. Write the prompt, source IDs, raw output, latency, usage, cost, hashes, and deterministic validation into a private ignored artifact directory with `0600` files.
5. Retain failed attempts beside the accepted attempt; do not silently replace evidence.
6. Run targeted lint, typecheck, and executable harness checks when the experiment adds code. Add `npm run check` only when the experiment changes shared runtime or another broad production boundary. Browser E2E is not required when no route, runtime, database write, or product prompt changes.
7. Refresh REPOMAP and the incremental JCodeMunch index at closeout. If JCodeMunch cannot index the experiment's file type, report the exact limitation and use REPOMAP plus targeted source validation rather than calling the index current for that file.

For a new report architecture, prefer direct chart-signal generation over feeding prior report prose back into the writer. Persist source chart IDs, the exact calculated signal packet, and `sourceReportIds: []` in the private manifest. Treat a selected signal packet as affirmative evidence, not an exhaustive chart: the writer must not infer that unlisted contacts are absent or use omissions to rank which person contributes more.

When comparing ranked evidence with a complete calculated inventory, define the editorial question before the paid call and keep model, structure, privacy, and provider controls fixed. Blind the portrait labels before editorial scoring, then reveal the mapping and reconcile that judgment with evidence density, repetition, named-perspective balance, cost, and latency. Treat completeness as an audit surface, not an automatic writer improvement: reject prose that turns contact counts into a contribution ledger, and verify that the writer does not reverse which person's natal bodies form a contact.

When a report bakeoff receives an Ally relationship label, treat the label as tone-routing context rather than chart evidence or biography. Verify the stored value read-only, record the selected tone mode, and reject prose that converts labels such as `spouse`, `friend`, or `child` into unsupported claims about history, consent, permanence, satisfaction, duty, or current relationship state. Family-caregiving and child modes require non-romantic chapters; raw degree and orb trace should remain out of finished prose.

For clean-prose report experiments, assign stable evidence IDs to the direct signal packet and keep the ID-to-signal index plus chapter trace private. Verify trace completeness and semantic fidelity separately, but do not mistake instrumentation for reader quality. Apply ±10% to numeric targets and record misses plainly. Reserve fatal errors for broken source/evidence boundaries, technical or evidence-ID leakage, malformed private trace, concrete invented biography or literal danger, protagonist erasure, and severe semantic misrepresentation. Fate metaphor, imaginative reach, contribution-language risk, length, name counts, and literal tone keywords are review notes unless they cross into those fatal categories. Green-light imaginative prose unless more than two fatal-error categories remain; human product judgment can supersede a conservative editorial model.

When synthesizing against an accepted reader benchmark, encode its approved qualities in the writer contract without supplying its prose. Read the benchmark only after the candidate returns, assert the same signal labels and stable evidence IDs, then blind the comparison. Scan technical leakage contextually: ordinary words such as `house`, `degrees`, and `opposite` are not astrology by themselves. Conversely, italicized first-person thoughts attributed to a named subject are fabricated speech even without quotation marks.

When promoting a clean-prose experiment into production, freeze the server-derived tone and exact selected Evidence packet in the new report result; never rebuild those private drawers when an old report is opened. Keep the semantic-support call separate from Evidence-ID coverage, retain every rejected writer attempt only in private failure metadata, and permit exactly one corrective retry. Browser acceptance must prove both halves of the shared reader: owner Evidence and review notes survive reload, while logged-out share DOM and HTML payload contain no trace IDs, technical Evidence, rejected text, private provenance, or internal review notes.

When lived relationship depth is not supplied, a coherent Synastry packet establishes potential rather than actuality. For a grounded-prose bakeoff, require every prose paragraph to map privately to stable Evidence IDs and record three distinct supports: the plain-language mechanism, a conditional lived expression, and the relational consequence. Generate from recalculated direct signals first; load any saved comparison portrait only after the writer returns, then match immutable IDs and signal labels before blind scoring. Score reality calibration separately from evidence fidelity: technical support for a theme does not prove mutual attraction, private interiority, intimacy, history, commitment, or an already active relationship. Preserve emotional force, but treat invented wound/history language as one fatal category and repetitive hedging as an editorial note under the ±10%/more-than-two-fatal policy.

Synastry prose should lead with psychology, not astrology exposition. Occasional direct-aspect references are acceptable when they sharpen a paragraph's psychological mechanism. Do not impose a visible prose quota: tell the writer to give each paragraph only the astrology it needs. The private validator should catch a return to astrology-dominated writing (more than 15 technical terms, more than five astrology-bearing paragraphs, more than three heavy paragraphs, any astrology-led paragraph, or any visible Evidence ID) while allowing the accepted Michelle V3.1.1 balance.

Long-form Synastry generation includes both the visible portrait and a private paragraph-level Evidence trace, so its provider budget must cover both artifacts. Use the Deep-report bounded timeout and completion ceiling for this path; a 90-second timeout or 4,200-token ceiling can discard otherwise complete prose before the trace closes. On corrective retries, explicitly prohibit analysis or thinking blocks. Keep semantic review independent: retry malformed reviewer JSON once, then preserve a deterministically valid portrait with a private reviewer-unavailable note instead of regenerating or failing the writer output.

### Synastry V3.1 production reliability and cleanliness lessons

- Diagnose the stage, not the generic UI failure. A valid writer draft can be lost because the semantic reviewer returns truncated non-JSON; a writer call can time out before returning; or a complete portrait can be truncated before its private trace closes. Persist enough private failure metadata to distinguish these cases without exposing rejected prose publicly.
- The 1,500-word portrait and its paragraph trace are one output budget. Michelle proved that 4,200 tokens truncates the trace, 6,500 can still truncate a corrective response that emits unwanted reasoning, and the existing 8,000-token Deep ceiling is the appropriate bounded production allowance.
- A long OpenRouter portrait can legitimately exceed 90 seconds. Michelle failed at 90.7 seconds under the standard timeout and later completed under the 240-second Deep boundary. Do not mistake provider latency for invalid prose.
- Semantic review is advisory evidence, not the writer transaction. Retry malformed reviewer JSON once with a compact prompt and larger reviewer allowance; if it remains unavailable, preserve a deterministically valid portrait and add a private review note.
- Keep the strongest-15 direct chart packet and stable IDs as the sole writer evidence. Saved portrait prose and complete-inventory prose remain prohibited inputs. Store one mechanism, conditional lived expression, and relational consequence for every rendered paragraph.
- Existing report records are immutable. Live debugging creates a new request; failed attempts remain historical records and do not silently mutate or replace an earlier portrait.
- The numeric acceptance policy and the reader-quality judgment are separate. Michelle's completed 3.1 report met 1,428 words, all 14 paragraph traces, semantic review, and the `more than two fatal categories` green-light rule, yet retained two categories: `technical_surface` and `perspective_erasure`. Its 49 technical terms, 34.9 terms per 1,000 words, and 10 astrology-heavy paragraphs are reliable evidence that green-light does not necessarily mean clean prose.
- Therefore report closeout must state both outcomes: deterministic acceptance and editorial cleanliness. Under the approved policy, exactly two fatal categories may ship as green-with-notes; do not describe that result as technically clean. A future prompt iteration should reduce astrology at generation time and strengthen second-person perspective without changing the strongest-15 evidence path or the acceptance arithmetic unless Tony approves a policy change.
- Owner/public boundaries are part of reliability. Verify six owner Evidence drawers against the frozen trace and prove that logged-out public shares contain no Evidence IDs, technical drawer content, rejected attempts, provenance, or internal review notes.
- Perspective validation must recognize the Ally's first name as a valid named presence. Requiring the exact full stored name creates a false `perspective_erasure` category even when every chapter independently voices the Ally. Separately require `you` or `your` in every prose paragraph so second-person address cannot be satisfied only once per chapter.
- Corrective retries should describe the editorial direction, not micromanage prose with numeric rewrite quotas. Preserve concrete trace and boundary errors, but for technical surface ask the writer to thin astrology commentary, keep only aspect references that sharpen psychology, and move the rest into private Evidence.

For private portrait reassessment, require the caller's sample and experiment-mode flags to match the saved manifest before writing new evaluation files. A mismatched default sample can otherwise turn valid Rachel headings and traces into false Cheyenne failures and overwrite the useful reassessment summary.

Treat an explicitly selected Synastry reader as an instruction boundary, not an editorial preference that the fatal-error budget may forgive. Persist the reciprocal basis with that reader first, require every rendered chapter to address that person as `you` or `your`, and reject chapter prose that names the selected reader in third person. Test the reciprocal writer prompt as well as the basis-order helper. On Ally cards, expose personal-data ownership through a visible edit action; tag changes must confirm and survive reload, and any linked birth-detail action must open an enabled edit state rather than silently returning to report ordering.

Treat an editable Ally relationship tag as live routing data. Imported chart context may retain the historical tag for provenance, but report-order UI and new report tone selection must resolve the current owner-scoped Ally record first. For an imported-record repair, canonicalize tag casing and synchronize only linked chart headers/context in an idempotent transaction; leave historical report snapshots unchanged and preserve orphan charts unless deletion is separately authorized. Prove the fix with a zero-change second dry run and a browser journey that edits the tag, reloads, then opens report ordering and sees the new value.

### Private OpenRouter bakeoff credential

Standalone experiment scripts do not automatically load Next.js environment files. On Tony's current machine, the usable local OpenRouter secret is stored in the canonical Astra app's ignored file at `/Users/tony/Documents/Projects/Astra/apps/astra-web/.env.local`. Source that file in the bakeoff subprocess before running `tsx`; never print, copy into tracked files, or record the value. Do not use `vercel env pull` to recover it: sensitive production values are returned as `[SENSITIVE]`, and sourcing that redacted file can also replace a valid local database URL.
