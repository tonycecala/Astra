---
title: "Synastry V3 clean-prose production implementation plan"
status: "ready-for-implementation"
created: "2026-07-31"
updated: "2026-07-31"
type: "implementation-plan"
project: "Astra Clean Start"
owner: "Codex"
branch: "codex/dual-perspective-synastry-bakeoff"
planning_commit: "4bfbd33"
accepted_reader_benchmark: "The Undertow of Recognition"
production_status: "not-implemented"
---

# Synastry V3 Clean-Prose Production Implementation Plan

## Decision

Close the private Synastry V3 bakeoff with *The Undertow of Recognition* as
the accepted reader benchmark. Promote its tested architecture, not its prose:

- keep the existing direct-chart calculation and strongest-15 selection path;
- write the portrait feeling first, with technical astrology removed from the
  rendered prose;
- address the selected reader as `you`, give the Ally an independent
  perspective, and treat the relationship as a third protagonist when a lived
  relationship is actually established;
- persist an immutable private Evidence index and chapter trace with stable
  IDs;
- route tone from the Ally tag, including `Lover`, without treating the tag as
  biography; and
- apply the approved numeric tolerance and fatal-category budget without
  turning editorial instrumentation into the reader verdict.

The complete 36-contact inventory remains an audit tool. It does not replace
the strongest-15 writer packet. No saved report prose becomes writer input.

## Verified current state and production gaps

| Current production behavior | Gap to close |
| --- | --- |
| `synastryReportSectionSignalCards` calculates direct cross-chart signals and selects up to four signals for each of the four existing evidence jobs. | Preserve this calculation and selection exactly, then deduplicate and snapshot the selected packet for V3. Do not create a second chart-calculation path. |
| `synastryV1CardBlock` sends at most three interaspects per evidence job to the current four-chapter writer. | V3 must receive the complete selected strongest-15-policy packet used in the successful private experiment, not the current reduced writer view. |
| Synastry currently asks for four 450-650-word chapters and permits technical contact language. | V3 needs one approximately 1,500-word, six-chapter, technical-free portrait whose paragraphs lead with feelings and consequences. |
| `ReportReader` reconstructs Evidence from the request whenever the report is opened. | V3 Evidence must come from the immutable result snapshot so engine changes cannot rewrite an old report's proof. |
| The same `ReportReader` renders Evidence on public share links. | Evidence, trace, internal validation notes, and stable IDs must be owner-only. A shared report exposes the portrait, not the private proof. |
| `Ally.relationship` is required free text; onboarding has a text box and existing Ally details are effectively locked. | Restore a canonical Ally-tag chooser and a small edit path. Include `Lover`; preserve and safely normalize legacy free text. |
| The report-order route copies context from the current reader chart. | When the reader is Self, the Ally relationship label can be lost. Resolve the live Ally record server-side and snapshot the normalized tone policy onto the report request. |
| Report results already persist `generation_metadata` as JSONB. | Add the optional V3 packet, trace, tone, and acceptance metadata there. No SQL column is required. |

## Product and design contract

Relevant product-pattern files:

- `patterns/05-progressive-disclosure.md` — the portrait is the first layer;
  technical Evidence is an owner-only disclosure beneath each chapter.
- `patterns/13-intent-mirroring.md` — the selected Ally tag controls an explicit,
  understandable tone policy; chart contacts never guess the relationship type.
- `patterns/20-fail-safe.md` — legacy labels remain readable, unknown labels
  fall back to neutral, and an edit never rewrites an existing report snapshot.
- `patterns/36-trust-building.md` — Astra explains Evidence without presenting
  itself as an oracle or exposing private proof on a public share.

Intended user outcome: the reader receives the emotional meaning first, can
open the proof only when wanted, and can trust that Astra will not sexualize a
child, invent a relationship from a label, or silently change an old report.

The implementation must define logged-out, empty, loading, success, and error
states in the journeys below. All chooser labels, drawer labels, status text,
errors, and accessible names flow through `apps/astra-web/lib/i18n.ts`.

Analytics are N/A for the first implementation slice because Astra has no
runtime analytics transport. Reserve, but do not scatter, these future event
names: `ally_relationship_tag_selected`, `ally_relationship_tag_updated`, and
`report_evidence_drawer_opened`.

Dark-pattern review: no fear copy, opaque personalization, false certainty,
urgency, contact upload, or compulsory disclosure. The Ally tag is plainly
described as a writing lens, not proof about the bond.

## Ally tag and tone-routing contract

The canonical create/edit chooser contains every legacy Ally type except
`Self`, which belongs to the Self chart path. `Self` remains explicitly handled
as ineligible rather than disappearing from the policy.

| Ally tag | Structural lens | Romantic-language policy | Required treatment |
| --- | --- | --- | --- |
| `Self` | natal/ineligible | N/A | Route to Self; never create a Self Ally. |
| `Family` | family-generic | prohibit | Family-system language; no invented hierarchy, duty, or repair. |
| `Mother`, `Father` | family-parent | prohibit | Attachment, authority, inheritance, and individuation without gender stereotypes or filial duty. |
| `Child` | family-caregiving-child | prohibit absolutely | Child-safe chapters; no eroticization, partner equivalence, adult emotional labor, or parenting verdict. |
| `Lover` | adult-romantic | lead-romantic-sexual | Open with romantic and sexual charge supported by selected evidence; consent, history, exclusivity, and permanence remain unknown. |
| `Spouse`, `Companion` | adult-romantic | allow-full-romantic | Romantic language is allowed when evidence supports it; the label proves no history, satisfaction, monogamy, or outcome. |
| `Ex` | former-romantic | allow-full-romantic | Historical romantic tone is allowed; present contact, reunion, unresolved desire, and preferred outcome remain unknown. |
| `Friend` | friendship | allow-adult-overtones | Stay friendship-led while permitting adult-romantic overtones; attraction never proves romance or consent. |
| `Partner` | adult-neutral-partnership | prohibit | Partnership, negotiation, and closeness without assuming romance. |
| `Sibling` | family-peer | prohibit | Loyalty, rivalry, differentiation, and repair without fixed family roles. |
| `Business`, `Colleague`, `Client` | professional | prohibit | Collaboration, agreements, boundaries, and power; no off-record romance or outcome claims. |
| `Mentor`, `Student`, `Guide` | mentorship | prohibit | Learning, projection, responsibility, authority, and boundaries without romanticizing asymmetry. |
| `Ancestor` | ancestral-symbolic | prohibit | Lineage and symbolic continuity; no invented reciprocal communication or approval. |
| `Archetype` | symbolic | prohibit | Symbolic resonance and projection, not a two-person lived relationship. |
| `Historical Figure`, `Public Figure` | observational | prohibit | Comparison-only language; no mutual influence, contact, consent, endorsement, or private-state claims. |
| `Other` | neutral | prohibit | Neutral connection language; the chart does not decide what the relationship is. |

Unknown legacy values normalize to `neutral` and retain their original display
text. Known values normalize case-insensitively, so `Friend` and `friend` route
identically. Editing an existing Ally replaces the stored value with the
canonical tag but does not alter past chart requests or reports.

For each new Synastry request, the authenticated report route resolves the
current Ally by `allyId` and persists this server-derived snapshot:

```ts
type SynastryToneSnapshot = {
  policyVersion: "ally-tone-v1";
  allyId?: string;
  authoredRelationship: string;
  normalizedTag: AllyRelationshipTag | "unknown";
  structuralLens: SynastryStructuralLens;
  romanticLanguage: "lead-romantic-sexual" | "allow-full-romantic" | "allow-adult-overtones" | "prohibit";
};
```

The client cannot submit or override the normalized lens. If the pair does not
contain exactly one resolvable Ally, use the neutral policy. The snapshot stays
fixed even if the Ally tag is edited later.

## Strongest-15 packet and stable private Evidence

Add one production projection over the existing selected cards:

1. Build the existing `Attraction`, `Friction`, `Communication`, and
   `Stability` evidence jobs with `buildAstrologyReportSectionEvidence`.
2. Preserve their current order, deduplicate identical labels, and assign
   `S01`, `S02`, ... once per report.
3. Treat “strongest-15” as the selection policy, not a promise to pad every
   chart to 15. Tony + Cheyenne yields 15 unique interaspects plus the timed
   Moon comparison; other pairs may yield fewer.
4. Tell the writer that the packet is curated and non-exhaustive. Unlisted
   contacts are unknown, never absent evidence or a contribution ranking.
5. Persist the exact index used by the writer. Never reconstruct a V3 result's
   Evidence by rerunning the current engine.

The optional result metadata is versioned and stored in the existing
`generation_metadata` JSONB:

```ts
type SynastryV3Metadata = {
  schemaVersion: 1;
  tone: SynastryToneSnapshot;
  evidenceIndex: Array<{
    id: `S${string}`;
    label: string;
    meaning: string;
    evidenceJobs: string[];
  }>;
  chapterTrace: Array<{
    chapter: string;
    evidenceIds: string[];
    supportedFeeling: string;
  }>;
  validation: {
    wordCount: number;
    acceptedWordRange: { minimum: 1350; maximum: 1650 };
    boundaryViolations: string[];
    fatalCategories: string[];
    reviewNotes: string[];
    greenLight: boolean;
  };
};
```

Private chapter drawers resolve `chapterTrace.evidenceIds` against the stored
index and show the stable ID, technical label, and meaning. The portrait body,
downloaded portrait prose, copied portrait prose, public share, and public
signal contain no evidence IDs or technical astrology. Owner exports may
include an explicitly labeled Evidence appendix because they are private.

Legacy reports are not backfilled or regenerated. They may keep the current
deterministic Evidence fallback, labeled internally as legacy, while all V3
reports require the stored snapshot.

## Feeling-first writer structure

The writer receives only the tone snapshot and selected direct signals. It
never receives *Undertow*, another saved portrait, or prior report prose. The
prompt encodes these accepted qualities:

- simple enough to understand in one reading;
- lead each paragraph with a specific feeling, desire, fear, bodily response,
  reversal, or hidden relational consequence;
- use one light consequence, contrast, or complication as support;
- address the selected primary reader as `you`;
- voice the Ally's interiority as possibility without fabricated quotation;
- give the relationship agency in every lived-relationship chapter; and
- keep technical proof entirely in the hidden trace.

Use four six-chapter heading families so tone changes structure without
creating one prompt per tag:

| Structural family | Chapter emphasis |
| --- | --- |
| Lived adult / romantic / friendship | Recognition; what the Ally awakens in you; what you awaken in the Ally; closeness or desire turning under pressure; hidden bargain or consequence; relationship as third presence. |
| Family / child | Recognition; each person's distinct experience; safety, attachment, and trust; will, friction, and repair; care and autonomy; family bond as a living system. |
| Neutral / professional / mentorship | Recognition; each person's distinct experience; coordination and communication; power, boundaries, or friction; hidden consequence; working bond as a system. |
| Symbolic / observational | Recognition; what the comparison evokes in the reader; what the other chart symbolizes without invented interiority; projection and distance; interpretive limit; comparison as a meaning-making field. |

The output contract remains the experiment's two-block format: rendered
Markdown plus private trace JSON. The parser validates and separates the blocks
before creating report sections; trace JSON never enters section bodies.

## Acceptance and retry policy

The production gate has two layers.

### 1. Authorization and privacy boundaries

These are not editorial tradeoffs and must pass before the fatal-category
budget is considered:

- writer input contains direct selected chart signals and no saved report prose;
- owner-only Evidence does not appear on public/shared surfaces;
- a `prohibit` tone policy contains no romantic, erotic, or sexual framing;
- the model response can be split into valid portrait and trace blocks; and
- every trace ID resolves to the immutable packet.

A boundary failure triggers the one corrective retry and can never be persisted
as a completed report if it remains.

### 2. Fluid editorial gate

Deduplicate findings by category. Green-light the report with private review
notes when zero, one, or two categories remain. Three or more categories cause
one corrective retry through the existing retry orchestration. If the retry
still has three or more, persist a failed result and retain the rejected text
only in private generation metadata.

Fatal categories:

1. `format_integrity` — the six-chapter portrait is unusable.
2. `technical_surface` — technical astrology or Evidence IDs leak into prose.
3. `invented_reality` — fabricated speech, concrete biography, literal danger,
   diagnosis, or fixed relationship history.
4. `perspective_erasure` — one of the required protagonists disappears.
5. `semantic_fidelity` — an independent support check finds severe
   misrepresentation of the supplied packet.
6. `comparative_verdict` — prose makes fixed claims that one person carries,
   gives, earns, or costs more from contact volume or direction.
7. `identity_integrity` — an Ally tag becomes part of a person's name or
   identity rather than routing context.

Evidence-ID coverage and semantic support are separate results. Trace coverage
proves which signals were cited; a short post-writer semantic-support check
reviews whether representative emotional claims are actually supportable. It
does not compare against Undertow and does not become the reader verdict.
Use the already configured report provider/model with the same production
controls and a 700-token output ceiling; return structured supported claims,
unsupported claims, and severity only. Record this call's tokens, cost, and
latency separately in V3 metadata so the quality gain remains auditable.

Numeric policy:

- target 1,500 words; 1,350-1,650 is within the explicit ±10% band;
- values outside the band are recorded as review notes, not fatal categories;
- numeric name, chapter, and evidence counts are review instruments unless
  they prove actual structure loss or protagonist erasure; and
- a conservative evaluator preference never overrides direct reader judgment.

Contextual leakage rules match unambiguous technical terms directly but require
technical context for ambiguous English: ordinal/number + `house`, number +
`degrees`, and astrological syntax around `opposite`. Italicized first-person
thoughts attributed to a named person count as fabricated speech just like
quotation marks.

## Smallest production edit surface

| File | Required production change |
| --- | --- |
| `packages/contracts/src/index.ts` | Add canonical Ally-tag/tone schemas, optional request tone snapshot, optional `generationMetadata.synastryV3`, and the new validation issue codes. Keep persisted `Ally.relationship` backward-compatible as string. |
| `packages/astrology/src/report/allyTone.ts` (new) | Central table-driven normalization, structural lens, romantic policy, and four heading families. |
| `packages/astrology/src/report/synastryV3.ts` (new) | Build the stable packet from existing evidence cards, assemble the feeling-first prompt, parse portrait/trace blocks, and project private metadata. |
| `packages/astrology/src/report/synastryV3Validation.ts` (new) | Contextual leakage, tone, trace, perspective, numeric, invented-reality, and fatal-budget checks. Keep regex policy out of the monolithic engine. |
| `packages/astrology/src/index.ts` | Route only `reportType === "synastry"` through V3 generation and the existing direct calculation; attach stored metadata and use one corrective retry. Natal/progressed behavior stays untouched. |
| `packages/db/src/repositories.ts` | Add owner-scoped Ally lookup/update. Existing JSONB result persistence already carries V3 metadata. Return a public-safe shared-report projection that omits V3 Evidence/trace metadata, private provenance, and internal review notes. |
| `apps/astra-web/app/api/allies/[allyId]/route.ts` | Add authenticated, owner-scoped `PATCH` for canonical relationship tag updates. Keep `DELETE` unchanged. |
| `apps/astra-web/app/api/reports/route.ts` | Resolve the live Ally tag, derive tone server-side, and snapshot it into the immutable report request for either reading perspective. |
| `apps/astra-web/components/BirthOnboardingPanel.tsx` | Replace the free-text relationship field with the canonical selector for new Allies. Reuse current form states and submit path. |
| `apps/astra-web/components/AllyRelationshipEditor.tsx` (new) | Small inline edit control for an existing Ally tag with loading, success, and error feedback. |
| `apps/astra-web/app/allies/page.tsx` | Render normalized display labels, mount the editor, and collapse legacy `Friend`/`friend` values into one filter option. |
| `apps/astra-web/components/ReportReader.tsx` | Prefer stored V3 Evidence, keep legacy fallback private, and suppress Evidence plus internal review notes when `shared`. |
| `apps/astra-web/components/ReportMarkdown.tsx` | Accept stable IDs in the existing drawer rows. Preserve the current native `<details>` progressive-disclosure pattern. |
| `apps/astra-web/lib/i18n.ts` | Add all canonical Ally option labels, edit states, Evidence language, and errors. |

No planned CSS change is required; reuse the existing form, button, badge, and
`reportMarkdownEvidence` styles. Add CSS only if rendered browser evidence
shows a real layout defect.

Explicitly out of scope:

- `crossChartSignals`, ephemeris/aspect calculation, and orb policy;
- complete-inventory generation as writer input;
- SQL/Drizzle schema or migration files;
- natal, progressed, Core, Deep, Journey, Composer, credit, or payment logic;
- rewriting or regenerating existing reports;
- feeding *Undertow* or any saved report into the writer; and
- a second production report type or long-lived compatibility architecture.

## Migration and compatibility

| Area | Required action |
| --- | --- |
| Database schema | None. Keep `allies.relationship` as text; use existing request-context and result-metadata JSONB. Do not generate a Drizzle migration. |
| Existing Ally rows | No bulk update. Normalize known labels at read/request time, preserve unknown text, and move a row to the canonical value only when the owner edits it. |
| Existing chart requests | No rewrite. New report requests resolve the live Ally row first and use chart-context relationship only as a legacy fallback. |
| Existing report results | No backfill or regeneration. V1 reports retain their original prose and legacy Evidence behavior. |
| New V3 results | Persist prompt version, tone policy version, exact evidence index, trace, and acceptance result so later engine changes do not alter them. |
| Shared reports | Project the stored result to public-safe fields before rendering. Do not expose private V3 metadata and do not reconstruct legacy Evidence in shared mode. |
| Rollback | Revert the Synastry-only prompt-version switch. Optional V3 metadata remains readable and harmless; no data rollback is necessary. |

## Tests to implement

### Deterministic and contract tests

- Add `scripts/smoke-ally-tone-routing.mts`: table-test all 23 legacy values,
  canonical casing, unknown fallback, the five romantic-language types, Lover's
  lead policy, and Child/all-other prohibition.
- Add `scripts/smoke-synastry-v3-packet.mts`: prove the V3 projection uses the
  existing selected direct signals, assigns stable unique IDs, does not pad a
  short packet, records `sourceReportIds: []`, and never calls the complete
  inventory path.
- Add `scripts/smoke-synastry-v3-validation.mts`: test 1,350/1,650 boundaries,
  out-of-band numeric notes, two-category green, three-category rejection,
  invalid IDs, malformed trace, italicized speech, and contextual `house`,
  `degrees`, and `opposite` examples.
- Extend `scripts/smoke-report-basis-contracts.mts`: tone snapshot remains the
  same when the reading perspective swaps chart order.
- Extend the Ally API smoke: create and patch canonical tags, reject `Self`,
  reject cross-owner edits, and preserve a legacy unknown label until edited.
- Extend report API/engine smokes: resolve the live Ally tag server-side,
  prohibit client lens overrides, keep exact direct signals, separate prose
  from trace, and persist <=2 versus reject >=3 fatal categories correctly.
- Add a shared-report assertion: public HTML/RSC contains no Evidence drawer,
  stable ID, technical evidence text, or internal review note.

Suggested focused commands during implementation:

```bash
npx eslint packages/contracts/src/index.ts packages/astrology/src/index.ts packages/astrology/src/report/allyTone.ts packages/astrology/src/report/synastryV3.ts packages/astrology/src/report/synastryV3Validation.ts
npm run typecheck
npm run test:ally-api
npm run test:report-api
npm run test:report-basis-contracts
npm run test:astrology-engine
npx tsx scripts/smoke-ally-tone-routing.mts
npx tsx scripts/smoke-synastry-v3-packet.mts
npx tsx scripts/smoke-synastry-v3-validation.mts
npm run check:i18n
```

The lint command is deliberately path-scoped for the inner loop; add the
changed Astra route/components to that invocation as they are implemented.

### Release checkpoint

Because the implementation will change contracts, persistence payloads,
authenticated Ally editing, report generation, and the public/private share
boundary, a production build and focused Playwright journeys are justified once
the slice is complete. Do not run broad release E2E repeatedly during prompt,
test, or CSS iteration.

## Browser journeys for the implementation task

Use `astra-browser-qa` only after the implementation exists. Start with
structured tests and API evidence, then run these rendered journeys:

| Journey | Route / viewport | Proof |
| --- | --- | --- |
| Logged-out boundary | `/allies`, `/library` | Auth gate/redirect works; no private Ally, report, tone, or Evidence data appears. |
| Empty Ally state | `/allies` at 390x844 | Empty state reaches Ally creation; canonical selector is labeled, keyboard usable, and contains Lover plus all approved non-Self tags. |
| Create Lover | `/allies` at 390x844 and 1440x900 | Create an Ally with Lover, observe disabled/loading state, success, canonical badge, and persistence after reload. |
| Edit legacy Friend | `/allies` at 390x844 and 1440x900 | Change a legacy Friend to Lover through the owner-scoped editor; error remains recoverable; reload proves persistence. Past reports remain unchanged. |
| Lover report | Ally report flow -> `/library?reportId=...` at 1440x900 | Opening is romantic and sexual; six chapters are feeling-first; reader is `you`; Ally and relationship perspectives remain distinct; portrait body has no technical terms or IDs. |
| Child report | Ally report flow -> Library at 1440x900 | Child-safe headings and family language; no romantic, erotic, sexual, lover, chemistry, or adult-partner framing; no burden assigned to the child. |
| Friend report | Ally report flow -> Library at 1440x900 | Friendship leads; adult-romantic overtones are allowed but not asserted as biography or consent. |
| Prohibited-romance representative | Business or Colleague report | Interpersonal charge is translated without romantic or erotic framing. |
| Observational representative | Public Figure report | Comparison language does not invent reciprocity, contact, endorsement, or private interiority. |
| Private Evidence | `/library?reportId=...` at 390x844, 820x1180, 1440x900 | Drawers are closed by default, readable when opened, show stable IDs and exact stored evidence, do not overflow, and remain identical after reload. |
| Reciprocal perspective | Generate primary-reader and comparison-reader versions from the same pair | The addressed `you` changes, the Ally tone snapshot and evidence calculation remain stable, and neither report merges the two perspectives. |
| Public share boundary | Create share, then open `/reports/share/[token]` logged out | Portrait is readable; Evidence drawers, IDs, technical evidence, internal validation notes, and owner controls are absent from DOM and response payload. |
| Acceptance failure | Fixture provider output with three fatal categories | One corrective retry occurs; persistent failure is clear and no malformed completed report appears. A two-category fixture is completed with private review notes. |

For every changed report surface, review console/network errors, unexpected 500s,
hydration errors, and horizontal overflow. The final implementation checkpoint
uses phone, tablet, and desktop because the chooser, inline editor, reader, and
Evidence disclosure span form and report layouts.

## Implementation order

1. **Contract and tone snapshot** — canonical tags, normalizer, server-side Ally
   resolution, owner-scoped update, and request snapshot.
2. **Evidence and writer** — stable projection over existing selected cards,
   six-chapter prompt, two-block parser, semantic-support stage, and versioned
   metadata.
3. **Validation** — contextual leakage, trace integrity, hard tone/privacy
   boundaries, ±10% notes, fatal-category budget, and one corrective retry.
4. **Private presentation** — stored Evidence drawers for owners, public-share
   suppression, canonical Ally selector/editor, and i18n.
5. **Focused verification** — deterministic tests, targeted static checks,
   production build, and the browser journeys above; inspect the actual diff
   before committing.

Do not mix unrelated report refactors into this implementation. The production
switch is complete when the Synastry-only path satisfies the definition below;
there is no separate cleanup phase required.

## Definition of done

- *Undertow* is represented only as a quality benchmark in documentation; no
  prior portrait prose or saved report is sent to the writer.
- Production Synastry uses the existing direct strongest-15-policy selection
  and does not use the complete inventory.
- Every new V3 report snapshots tone, stable Evidence index, chapter trace, and
  acceptance metadata without a SQL migration.
- Lover leads romantic/sexual; Companion, Ex, Spouse, and Friend use their
  approved romantic policies; every other tag prohibits romantic framing.
- Child, symbolic, observational, and professional representatives pass their
  distinct safety contracts.
- Main portrait prose is technical-free and feeling-first; private drawers hold
  the proof; public shares hold neither Evidence nor internal review notes.
- Numeric misses are reported with ±10% tolerance, and the fluid report is
  green with no more than two editorial fatal categories after boundary checks.
- Targeted tests, production build, and named browser journeys pass with no
  console, network, privacy, or responsive-layout regression.
- Existing reports and Ally text survive unchanged until explicitly edited.

## Copy/paste implementation goal

```text
Continue from the production plan in docs/inbox-astra/ASTRA_SYNASTRY_V3_PRODUCTION_IMPLEMENTATION_PLAN.md on branch codex/dual-perspective-synastry-bakeoff. Implement the smallest Synastry-only production slice: preserve the existing strongest-15 direct chart calculation, add the feeling-first six-chapter V3 writer and immutable private Evidence trace, restore canonical Ally tag create/edit selection including Lover, snapshot server-derived tone routing, keep Evidence and review notes out of public shares, and enforce contextual leakage plus the ±10%/more-than-two-editorial-fatal policy. Do not use saved report prose or the complete inventory as writer input. Use targeted tests during iteration, then the justified production build and focused astra-browser-qa journeys from the plan. Preserve existing reports and free-text Ally values, inspect the final diff, commit intentionally, and do not push without approval.
```
