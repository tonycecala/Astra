---
title: "Next clean thread handoff: resume Semantic Synthesis V2 Phase 5 after the astrology refactor"
status: "active"
created: "2026-07-27"
date: "2026-07-27"
updated: "2026-07-27"
priority: "high"
type: "handoff"
project: "Astra Clean Start"
from: "/Users/tony/Documents/Projects/Astra"
to: "/Users/tony/Documents/Projects/Astra"
blocked_by: "Behavior-preserving refactor of packages/astrology/src/index.ts"
resume_phase: "Semantic Synthesis V2 Phase 5.1"
decision_at_handoff: "HOLD"
tags:
  - "handoff"
  - "fresh-thread"
  - "astra"
  - "semantic-synthesis-v2"
  - "phase-5"
  - "post-refactor"
related:
  - "ASTRA_SEMANTIC_SYNTHESIS_V2_HANDOFF.md"
  - "../../evaluations/ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_EVALUATION.md"
  - "../../../akashic/skills/use-broad-gates-for-discovery-and-single-blocker-loops-for-remediation.md"
---

# Resume Semantic Synthesis V2 Phase 5 After the Astrology Refactor

## Purpose

Resume Phase 5 in a clean thread after the 4,562-line
`packages/astrology/src/index.ts` refactor is complete and behavior-preserving
verification passes.

This brief is intentionally dormant until that refactor finishes. It does not
authorize semantic remediation during the architecture work.

## Resume Condition

Begin this handoff only when all of the following are true:

1. The astrology refactor is complete on a known commit.
2. The public `@astra/astrology` API and report contracts are unchanged.
3. Every Phase 0–5 deterministic and calculation gate still passes.
4. Type checking and the refactor's directly affected tests pass.
5. The refactor worktree is committed or otherwise cleanly separated from this
   Phase 5 continuation.

If any condition is false, stop and finish the refactor first.

## Start the New Thread Here

1. Start from the verified post-refactor base on a fresh `codex/` branch.
2. Run:

   ```bash
   ak governance check
   ak doctor
   ak dirty
   git status --short --branch
   ```

3. Read, in order:

   - `AGENTS.md`
   - `akashic/repomaps/current.md`
   - this handoff
   - `docs/inbox-astra/active/ASTRA_SEMANTIC_SYNTHESIS_V2_HANDOFF.md`
   - `docs/evaluations/ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_EVALUATION.md`
   - `akashic/skills/use-broad-gates-for-discovery-and-single-blocker-loops-for-remediation.md`

4. Confirm the post-refactor module locations before editing. Do not assume
   functions remain in `packages/astrology/src/index.ts`.

## Proven State to Preserve

- Phase 5 remains **HOLD**, not failed and not approved for rollout.
- Core is materially better than V1 and is not the active remediation target.
- Canonical Identity remains shared across contexts and tiers.
- Tony remains a fixed historical control and must not be regenerated.
- Headings, presentation, UI, routes, database contracts, and public contracts
  remain outside Phase 5.1.
- Deep ownership uses deterministic eight-chapter assignment under the
  seven-complex ceiling.
- Blind Spots and Growth cannot share a primary complex.
- Repeated primaries require distinct evidence origins and applications.
- Chapter-local evidence authorization and all Phase 0–5 hard gates remain
  mandatory.

## Targeted Repairs Already Completed

Do not reopen these without a new regression:

- Marissa Gifts: a dispositor relationship rendered as an invented aspect.
- Marissa Gifts: a ruled house rendered as the ruler planet's placement house.
- Marissa Gifts: unnecessary orb narration.
- Marissa Gifts: a direct rulership fact expanded into a generic dispositor
  chain.
- Marissa Gifts: personal activation expanded beyond natal relevance.
- Marissa Relationships: an unsupported lunar-chain explanation.
- Marissa Blind Spots: slow-planet evidence expanded into privileged social
  perception and rapid certainty.

The evaluation packet contains the root cause, fixture, attempts, accepted
chapter, and cost for each repair.

## Remaining Phase 5 Blocker Families

Reconfirm these against the packet and post-refactor source before changing
code:

1. **Marissa counterevidence overreach**
   - Counterevidence must qualify an interpretation.
   - It must not prove established self-correction, a learned habit, or a skill
     already in use.

2. **Felicia context safety**
   - Remove inferences about another person's needs, fears, motives, or inner
     state.
   - Remove claims of privileged social perception.

3. **Felicia Deep conclusion repetition**
   - Prevent several chapters from landing on the same effort-calibration
     conclusion.
   - Preserve distinct mechanism, consequence, and conclusion ownership.

4. **Cheyenne evidence overreach**
   - Personal activation means natal relevance, not current pressure or timing.
   - Slow-planet evidence does not prove rapid certainty or wholesale change.
   - Direct dispositors and rulership paths must not become generic chains or
     invented aspects.
   - Possibility-based language must not wrap a categorical behavioral claim.

5. **Deep breadth and ownership confirmation**
   - After the sentence-level blockers pass, confirm stronger distinct
     candidates are not displaced by repeated Pluto or exploratory complexes.

Treat this list as a starting inventory, not permission to fix everything at
once.

## Required Remediation Method

Handle one blocker at a time:

1. Select one subject, one chapter, and one sentence-level failure.
2. State one root-cause hypothesis.
3. Trace the selected evidence through serialization, claim boundaries,
   generation guidance, and validation.
4. Add the exact rejected prose plus valid bounded paraphrases to deterministic
   preflight.
5. Fix the smallest shared cause.
6. Reuse existing output when the corrected validator can evaluate it.
7. If generation is necessary, generate only the affected chapter with bounded
   retries and persistent cost accounting.
8. Inspect the chapter against its selected evidence packet.
9. Record root cause, evidence, attempts, cost, and **PASS** or concrete
   **HOLD** in the Phase 5 evaluation packet.
10. Stop before selecting the next blocker unless Tony explicitly continues
    the loop.

Do not run the full cohort during sentence-level remediation. Return to the
complete deterministic, semantic, repetition, and human-review suite only at a
deliberate rollout milestone after the blocker set is complete.

## Guardrails

- Do not regenerate Tony.
- Do not begin Phase 6.
- Do not change headings or presentation.
- Do not change UI, routes, database contracts, or public contracts.
- Do not weaken or delete a hard gate merely to accept generated prose.
- Do not hide qualitative overreach behind hedging.
- Do not add stronger hooks or blocking infrastructure.
- Do not fold architecture cleanup into semantic remediation.
- Preserve unrelated worktree changes.

## Completion Gate

Phase 5 can move from HOLD to GO only after:

- every deterministic and calculation gate passes;
- no current-candidate semantic category is below 2;
- current-candidate semantic average is at least 2.6;
- current-candidate context-safety average is at least 2.8;
- every current Deep repetition score is at least 2;
- human review finds each regenerated Deep report materially better than V1;
- Tony remains separately reported as a historical benchmark.

If a gate fails, record **HOLD** and stop. Do not proceed into headings or
presentation.

## Copy/Paste Goal for the New Thread

> Resume Semantic Synthesis V2 Phase 5.1 from
> `docs/inbox-astra/active/ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_POST_REFACTOR_HANDOFF.md`
> only after verifying that the astrology refactor is complete and every
> preserved Phase 0–5 deterministic gate still passes. Work on one documented
> semantic blocker at a time using one subject and one chapter. Add an exact
> rejected-prose fixture, fix the smallest shared cause, generate only the
> affected chapter when necessary, inspect it against its selected evidence,
> record cost and PASS or HOLD in the Phase 5 packet, and stop before beginning
> another blocker. Do not regenerate Tony, run the full cohort, begin Phase 6,
> or change headings, presentation, UI, routes, database contracts, or public
> contracts.

## Recommended First Blocker

Start with Marissa's remaining counterevidence-to-established-self-correction
overreach. It is already isolated in the Phase 5 HOLD findings and is the
smallest clean test that the post-refactor evidence and validation paths still
preserve qualitative claim boundaries.
