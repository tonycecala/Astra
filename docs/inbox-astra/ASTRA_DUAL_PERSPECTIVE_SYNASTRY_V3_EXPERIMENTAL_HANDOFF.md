---
title: "Next thread handoff: Dual-Perspective Synastry V3 direct-signal experiment"
status: "ready-for-codex"
created: "2026-07-31"
updated: "2026-07-31"
priority: "high"
type: "handoff"
project: "Astra Clean Start"
owner: "Codex"
worktree: "/Users/tony/Documents/Projects/Astra-phase5-merge"
branch: "codex/dual-perspective-synastry-bakeoff"
experiment_commit: "3029399"
production_status: "experimental-only"
tags:
  - "handoff"
  - "fresh-thread"
  - "synastry-v3"
  - "dual-perspective"
  - "private-bakeoff"
---

# Continue the Dual-Perspective Synastry V3 Experiment

## Mission

Continue evaluating one richer Synastry format that gives equal narrative
weight to Tony's experience, Cheyenne's experience, and the relationship as a
third being. Preserve the psychological and literary standard of Cheyenne's
current report while keeping the experiment completely outside production.

The central result is already proven: V3 can be generated directly from Astra's
calculated chart signals. It does not need either participant's prior report as
writer input.

## Start Here

Work in the existing experimental worktree and branch:

```bash
cd /Users/tony/Documents/Projects/Astra-phase5-merge
git switch codex/dual-perspective-synastry-bakeoff
ak governance check
ak doctor
ak dirty
git status --short --branch
```

The verified executable experiment is commit `3029399`, two commits ahead of
`origin/alpha`; this handoff is committed immediately after it. Do not merge,
push, or move this experiment into production without Tony's explicit
approval.

Read in this order:

1. This handoff.
2. `scripts/experiments/run-dual-perspective-synastry-bakeoff.mts`.
3. `akashic/skills/private-shadow-generation-bakeoff-parity.md`.
4. `akashic/warnings/curated-chart-signal-packets-cannot-prove-absent-contacts.md`.
5. The accepted private packet's `README.md`, portrait, editorial comparison,
   chart signals, prompt, and manifest.

## Proven State to Preserve

Two committed iterations exist:

- `b5f1048` — created the private report-fed shadow bakeoff and its reusable
  verification procedure.
- `3029399` — replaced report prose and the manual evidence ledger with a
  canonical direct-chart-signal path.

The current runner:

- reads only Tony's and Cheyenne's completed private chart records;
- creates an immutable experimental Synastry request;
- uses `buildAstrologyReportSectionEvidence` as the signal authority;
- sends the resulting canonical evidence packet to
  `anthropic/claude-sonnet-5` with reasoning disabled;
- requires the exact revised eight-chapter structure;
- validates length, perspective balance, chapter headings, visible signal use,
  and unsupported Yod/composite/Davison claims;
- writes private mode-`0600` artifacts only under ignored `.astra-exports/`;
- performs no production or database write.

The source chart IDs are intentionally retained in the reproducible runner:

- Cheyenne: `v1-chart:4f42aa82-c5fd-41d2-96b6-7f9143ace78c`
- Tony: `0fac9ad6-6ccd-4a30-ac0b-480892254f0f`

Do not copy raw birth data into Git or the handoff.

## Accepted Private Evidence

The accepted direct-signal packet is local and intentionally untracked:

```text
/Users/tony/Documents/Projects/Astra-phase5-merge/.astra-exports/dual-perspective-synastry-bakeoff/2026-07-31T03-48-31-831Z/
```

Read these files in order:

1. `README.md`
2. `dual-perspective-synastry-portrait.md` — *The Weight of Water, The Shape of Stone*
3. `editorial-comparison.md`
4. `chart-signals.md`
5. `prompt.md`
6. `manifest.json`

The earlier accepted report-fed control remains available at:

```text
/Users/tony/Documents/Projects/Astra-phase5-merge/.astra-exports/dual-perspective-synastry-bakeoff/2026-07-30T23-06-01-029Z/
```

Use the two current reports and the report-fed V3 only as blind editorial
benchmarks. Do not feed their prose back to the direct-signal writer.

## Verified Result

| Measure | Report-fed control | Direct-signal V3 | Change |
| --- | ---: | ---: | ---: |
| Prior report prose supplied | Two reports | None | Eliminated |
| Input tokens | 12,263 | 2,475 | -79.8% |
| Output tokens | 8,342 | 8,625 | +3.4% |
| Total tokens | 20,605 | 11,100 | -46.1% |
| Model cost | $0.107946 | $0.091200 | -15.5% |
| Model latency | 116.834 seconds | 124.564 seconds | +6.6% |
| Final words | 4,076 | 4,107 | +0.8% |
| Supplied interaspects visibly grounded | Manual | 15 of 15 | Complete |

The direct-signal portrait passed all eight required headings and recorded 66
explicit Tony references, 67 Cheyenne references, and 12 relationship
references. Editorially, it retained the desired water, stone, fog,
load-bearing structure, erotic friction, and unequal-effort themes without
receiving the old reports' language or conclusions.

The accepted conclusion is that direct chart signals are the correct V3
generation dependency. Prior reports are comparison controls, not runtime
inputs.

## One Remaining Experiment

The canonical packet contains Astra's 15 strongest selected interaspects, not a
complete interaspect inventory. That creates a negative-space risk: a writer
may mistake an omitted contact for an absent contact, or treat the selected
packet's apparent imbalance as proof that one person objectively contributes
more to the relationship.

The current prompt explicitly forbids those conclusions, but the accepted prose
still leans slightly toward calling Cheyenne's Saturn labor
"disproportionate." The next useful bakeoff is therefore:

1. Produce a complete calculated interaspect inventory without changing
   production contracts or generation.
2. Generate one private V3 from that complete inventory with the same writer,
   structure, privacy controls, and validation.
3. Compare it blindly with the accepted strongest-15 portrait for psychological
   depth, evidence density, repetition, perspective balance, negative-space
   overreach, cost, and latency.
4. Decide whether completeness adds real meaning or merely adds interpretive
   noise. Do not assume the larger packet is better.

This is an experimental evaluation question, not approval to expand Astra's
production evidence selection.

## Commands

Generate the canonical signal packet without a model call:

```bash
npx tsx scripts/experiments/run-dual-perspective-synastry-bakeoff.mts --signals-only
```

Generate a new private portrait only when a paid model call is deliberately
part of the experiment:

```bash
npx tsx scripts/experiments/run-dual-perspective-synastry-bakeoff.mts --generate
```

Validate an existing portrait without regenerating it:

```bash
npx tsx scripts/experiments/run-dual-perspective-synastry-bakeoff.mts \
  --validate .astra-exports/dual-perspective-synastry-bakeoff/<run>/dual-perspective-synastry-portrait.md
```

## Verification and Known Tooling Issue

At commit `3029399`:

- `npm run check` passed, including lint, TypeScript, deterministic project
  checks, i18n and boundary checks, no-Supabase validation, and the production
  Next.js build.
- Browser E2E was correctly omitted because no route, UI, runtime prompt,
  persistence path, or production behavior changed.
- Steward review: **accept-with-notes**. The note is the strongest-15
  negative-space risk above.
- Git and Akashic dirty state were clean.
- JDocMunch was current and SHA-certified.
- JCodeMunch refresh succeeded for supported sources, but direct indexing of
  `.mts` still reports: `Unsupported file type: .mts. File not recognized as a
  supported language.` Use REPOMAP and targeted source search for this runner,
  and note the stale JCodeMunch limitation at work-session closeout.
- `ak doctor` still reports pre-existing repository-governance validation
  errors for missing `akashic/principles` and `akashic/frameworks` plus legacy
  frontmatter/Investigation gaps. They did not originate in this experiment.

## Guardrails

- Keep the work private, ignored, and experimental.
- Do not add a route, UI control, product prompt, schema, migration, or database
  write.
- Do not use either saved report as generation input.
- Do not claim omitted signals are absent.
- Do not weaken the current production Synastry path or its safety boundaries.
- Do not regenerate simply to polish prose; define the comparison question
  first.
- Preserve private file permissions and never commit `.astra-exports/`.
- Run the full `npm run check` if executable code changes.
- Refresh REPOMAP and the relevant Munch indexes at closeout; explicitly note
  whether the `.mts` JCodeMunch issue remains.
- Do not push without Tony's explicit approval.

## Completion Gate

The next thread is complete when it either:

- produces and reviews one valid complete-inventory private comparison, with a
  clear keep-strongest-15 or prefer-complete-inventory verdict; or
- proves from deterministic packet analysis that a complete-inventory model
  call would not answer a materially different editorial question, records the
  evidence, and stops without spending the call.

Record the actual diff and validation evidence, update the relevant Akashic
playbook only if a genuinely reusable procedure changes, refresh JCodeMunch at
session closeout even if the known `.mts` limitation remains, and leave the
branch clean. No production integration and no push.

## Copy/Paste Goal for the New Thread

```text
Continue the private Dual-Perspective Synastry V3 experiment from
docs/inbox-astra/ASTRA_DUAL_PERSPECTIVE_SYNASTRY_V3_EXPERIMENTAL_HANDOFF.md in
/Users/tony/Documents/Projects/Astra-phase5-merge on branch
codex/dual-perspective-synastry-bakeoff. Preserve the proven direct-chart-signal
generation path and keep all work outside production. Evaluate the one remaining
question: whether a complete calculated interaspect inventory produces a
meaningfully richer and more balanced portrait than Astra's strongest-15 packet,
or merely adds noise. Do not use either saved report as writer input. Make at
most one deliberate private Sonnet 5 generation after defining the comparison,
blindly compare depth, evidence density, repetition, all three perspectives,
negative-space overreach, cost, and latency, then record one clear verdict. Run
proportional verification, inspect the final diff, refresh REPOMAP and Munch,
note the stale JCodeMunch .mts issue at session closeout, leave Git clean, and do
not change production or push.
```
