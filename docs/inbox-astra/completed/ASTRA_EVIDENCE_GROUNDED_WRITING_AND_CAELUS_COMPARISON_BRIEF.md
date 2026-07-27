---
title: "Evidence-grounded writing research and Caelus comparison brief"
status: completed
type: research-and-implementation-brief
project: Astra Clean Start
author: Tony + Codex
created: 2026-07-27
updated: 2026-07-27
priority: P1
audience: Codex / engineering agents
mission: Improve Astra's evidence-to-prose boundary using proven data-to-text patterns, while evaluating Caelus locally as a comparison engine without replacing Astra's source of truth.
depends_on:
  - ASTRA_SEMANTIC_SYNTHESIS_V2_HANDOFF.md
  - ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_POST_REFACTOR_HANDOFF.md
  - ../../evaluations/ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_EVALUATION.md
---

# Evidence-grounded writing research and Caelus comparison brief

## Executive decision

Astra should not replace its current astrology engine with a third-party
calculation engine as the next move. The immediate problem is not that Astra
lacks enough chart facts. The problem is that the writer is asked to select,
prioritize, interpret, qualify, and phrase those facts in one generation step.

The strongest pattern found in comparable systems is a layered contract:

```text
validated chart fact
  -> selected fact atom
  -> bounded interpretation candidate
  -> chapter question and intended conclusion
  -> sentence plan
  -> prose claim with support metadata
  -> audit
```

Astra already has several of these layers: selected evidence, counterevidence,
claim boundaries, chapter ownership, and interpretive jobs. The next coding
work should make those surfaces smaller, more addressable, and more explicit to
the writer. It should not add more phrase-specific detectors unless a detector
protects a real factual or trust boundary.

Caelus is the most useful comparison candidate because its engine is MIT
licensed and its interpretation layer explicitly separates validated geometry,
fact atoms, selectors, rules, provenance, and citation auditing. We will run it
locally as a comparison/reference engine. That experiment is not permission to
replace Astra's calculation engine, copy its interpretation corpus, or change
the public `@astra/astrology` contract.

## Research sources and what each contributes

### 1. Caelus: validated astrology plus a separate interpretation seam

Primary sources:

- [Caelus repository](https://github.com/heavyblotto/caelus)
- [Caelus interpretation layer](https://www.ephemengine.com/docs/interpretation)
- [Caelus chart provenance](https://www.ephemengine.com/docs/provenance)
- [Caelus corpus guide](https://www.ephemengine.com/docs/corpus)

Caelus describes itself as a fact engine. Its chart computation stops at
validated geometry and does not ship flavour text. The interpretation layer is
explicitly a seam between facts owned by the engine and meaning supplied by a
rule corpus or an LLM.

Its central contract is useful for Astra:

- The engine owns facts.
- A caller-owned layer owns meaning.
- The framework owns the contract between facts and meaning.
- Meaning must not silently become a new chart fact.

Caelus projects a chart into a ranked list of typed fact atoms. Each atom has a
stable ID, a kind, involved bodies, salience, and plain factual text. The
documented kinds include placements, aspects, patterns, angles, dispositors,
receptions, dignities, transits, synastry, and other derived objects. The text
is factual rather than interpretive.

Selectors match those atoms. A rule then emits a reading entry that carries the
matched atom IDs and a salience score. `reconcile()` groups entries that share
facts, deduplicates repeated text, and can mark conflicts when a corpus declares
conflicting tags. The engine therefore does not ask the model to discover that
two statements refer to the same placement or that two rules conflict.

For LLM use, `chartBrief()` caps the fact set and renders stable IDs beside the
facts. The model writes novel prose but is asked to cite the IDs behind claims.
`auditCitations()` then reports valid, unknown, cited, and uncited facts. The
important lesson is that provenance is available during generation and remains
auditable afterward; it is not reconstructed from a finished paragraph alone.

Caelus also makes chart provenance first-class. Realm and certainty distinguish
an observed birth, a reported time, a forecast, a fictional chart, an
archetypal chart, and other cases. Inexact timing down-weights sensitive facts
such as the Moon and angles rather than pretending every input is equally
reliable.

### 2. Caelus delineations corpus: data-backed rules with rights metadata

The companion corpus is deliberately separate from the calculation engine. A
passage record binds a statement to a serializable selector, exact atom IDs,
source attribution, and rights metadata. The validation harness checks that the
selector fires only for its condition and that cited atom IDs exist.

This is a strong model for any future Astra interpretation corpus: content is
data, not scattered executable prose rules, and every statement has a condition
and provenance.

The corpus is not uniformly reusable. Its manifest distinguishes `pd-us`,
`cc0`, and `gratis-not-pd` material. Astra must use only material whose rights
permit the intended use, or obtain a separate license. We must not copy the
entire corpus merely because the engine is MIT licensed.

### 3. Kerykeion and its hosted Astrologer API

Primary sources:

- [Kerykeion GitHub and license](https://github.com/g-battaglia/kerykeion)
- [Kerykeion subject context documentation](https://kerykeion.net/astrologer-api/docs/v5/context/subject_context)

Kerykeion is a useful reference for structured astrology data and an
AI-oriented context serializer. Its hosted subject-context endpoint returns a
structured context string alongside the full calculated subject object. That
separation—raw calculated data versus a smaller LLM context—is worth studying.

The current Kerykeion repository is AGPL-3.0. Its own documentation states that
direct import into a project generally implies compatible open-source
obligations, and it recommends the hosted API for commercial or closed-source
applications. Astra should therefore not import Kerykeion directly without a
deliberate licensing decision and review.

The hosted API is a different product from the library. It may be usable as an
external service under its commercial terms, but it would introduce provider
cost, availability, privacy, and data-residency considerations. It is not a
license-free way to embed Kerykeion in Astra.

### 4. Zodiac Engine: useful architecture reference, weak license signal

Primary source:

- [Zodiac Engine GitHub](https://github.com/gsinghjay/zodiac-engine)

Zodiac Engine describes a straightforward pipeline:

1. Calculate chart data.
2. Format it into structured tables.
3. Add focus, tone, and length preferences.
4. Send a prompt to an LLM provider.
5. Render Markdown and extract highlights and suggestions.

That is a useful baseline for understanding why structured input is better than
raw chart objects. It is not a strong grounding architecture: the README does
not show claim-level provenance or an evidence audit, and its license section
says “MIT License” while also saying this is an assumption and that a license
file should be added. It also depends on AGPL Kerykeion.

Treat Zodiac Engine as a study reference only. Do not copy its code into Astra
based solely on the README license statement.

### 5. AstrologyAPI: commercial API, not open source

Primary sources:

- [AstrologyAPI product page](https://astrologyapi.com/products/astrology-json-api)
- [AstrologyAPI API reference](https://astrologyapi.com/developers/v1/api-reference)
- [AstrologyAPI terms](https://astrologyapi.com/legal/terms-service)

AstrologyAPI advertises consistent schemas across many traditions and exposes
structured planet, house, aspect, retrograde, dignity, lordship, and dispositor
data. That consistency is a useful product lesson.

It is a hosted proprietary service, not an open-source dependency. Its terms
include API rate limits, termination rights, retained provider intellectual
property, and restrictions against reverse engineering or building a similar
or competitive service. Astra should not use it as an implementation source.
It could only be considered as an explicitly approved external provider after
privacy, cost, availability, and terms review.

### 6. General evidence-grounded writing systems

#### Attribute First, then Generate

The ACL paper “Attribute First, then Generate” decomposes grounded generation
into content selection, sentence planning, and sequential sentence generation.
The selected source segment becomes the local attribution for the sentence.
This is almost exactly the missing middle layer in Astra: select first, plan
the claim, then write.

Source: [ACL Anthology paper](https://aclanthology.org/2024.acl-long.182/)

#### TRACER

TRACER treats provenance as part of generation. Each sentence is accompanied by
a structured record identifying its support unit and the semantic relation:

- `Quotation` — direct reuse;
- `Compression` — faithful condensation;
- `Inference` — a grounded derivation.

The relation matters. “This sentence cites a Moon placement” is less useful
than “this sentence is a bounded inference from the Moon placement and the
selected counterweight.”

Source: [TRACER](https://arxiv.org/abs/2605.09934)

#### PaperTrail

PaperTrail decomposes documents and generated answers into claims and evidence,
then maps supported, unsupported, and omitted information. Its user study is
also a warning: exposing more provenance lowered trust without necessarily
changing user behaviour. Astra should therefore keep most provenance internal
for review and auditing rather than turning the customer report into a debug
trace.

Source: [PaperTrail](https://arxiv.org/abs/2602.21045)

## License and adoption matrix

| Candidate | Status | Practical Astra position |
| --- | --- | --- |
| Caelus engine | MIT | Safe candidate for local comparison or carefully scoped integration, with attribution and normal dependency review. |
| Caelus delineations corpus | Mixed: `pd-us`, `cc0`, `gratis-not-pd` | Use only explicitly permitted sources; keep rights and source metadata attached. |
| Kerykeion library | AGPL-3.0 | Do not directly import into the closed Astra application without a licensing decision or commercial permission. |
| Kerykeion hosted API | Commercial external service | Possible vendor, not an open-source dependency; requires privacy, cost, and availability review. |
| Zodiac Engine | License claim is explicitly provisional; Kerykeion dependency is AGPL | Study architecture only until every repository license is verified. Do not copy code. |
| AstrologyAPI | Proprietary hosted API and terms | Vendor evaluation only; not source code or a reusable open-source layer. |

This is an engineering triage, not legal advice. A production dependency choice
still needs the project's normal license review.

## What Astra already has

Astra is not starting from zero. The current Semantic Synthesis V2 work already
contains or is building these useful surfaces:

- deterministic chart facts and structural facts;
- meaning complexes with support paths, counterevidence, confidence, and claim
  boundaries;
- chapter-specific evidence selection;
- chapter ownership and interpretive jobs;
- prompt-builder contracts and report-specific voice policies;
- shared production and evaluation validators;
- Phase 0–5 calculation and contract gates;
- private packets recording selected evidence, attempts, model cost, and
  decisions.

The problem is not absence of evidence. It is evidence surface shape. The
writer currently sees too much mixed material and must infer which parts are
facts, which parts are interpretations, which parts are counterweights, and
which parts are forbidden. That is why a technically valid dispositor path can
turn into a generic causal story, or a bounded possibility can turn into a
current behaviour claim.

## Proposed Astra writer data surface

The following is a design target for coding consideration, not an instruction
to add a new public API or database schema immediately.

### Fact atom

```ts
type WriterFactAtom = {
  id: string;                 // stable within the evidence packet
  kind: "placement" | "aspect" | "pattern" | "rulership";
  factualText: string;        // no interpretation
  sourcePathIds: string[];    // internal provenance
  salience: number;
  certainty?: "exact" | "approximate" | "representative";
};
```

The atom must be a direct selected fact, not an aggregate graph traversal. A
dispositor relationship can be an atom when it is itself selected; a whole
chain should not silently become a writer-facing fact.

### Interpretation candidate

```ts
type WriterInterpretationCandidate = {
  id: string;
  atomIds: string[];                 // usually 1–3 atoms
  boundedMeaning: string;            // what the facts may frame
  counterweightAtomIds: string[];
  prohibitedClaims: string[];       // biography, timing, etc.
  confidence: "high" | "medium" | "exploratory";
};
```

This is where Astra's semantic synthesis belongs. It should be explicit that a
candidate is a supported interpretation, not a new chart fact.

### Chapter brief

```ts
type WriterChapterBrief = {
  chapter: string;
  question: string;                 // one distinct chapter question
  selectedCandidateIds: string[];
  selectedAtomIds: string[];        // bounded to the writer packet
  counterweight: string;
  prohibitedClaims: string[];
  intendedConclusion: string;       // one owned conclusion
  ownershipBoundary: string;
};
```

This is the only interpretive surface the prose writer needs. It should not
receive the complete semantic graph, omitted-candidate inventory, or raw
provenance plumbing unless a specific internal debugging mode requests it.

### Sentence claim audit

```ts
type WriterSentenceClaim = {
  sentence: string;
  atomIds: string[];
  relation: "direct" | "compression" | "inference";
  boundaryCheck: "pass" | "hold";
};
```

This can remain private. It does not need to become customer-visible and does
not need to be a public report contract. Its purpose is to make review answer a
small question: “What selected facts does this sentence rely on, and is the
semantic step direct, compressive, or inferential?”

## Prompt shape to test

The shared writer prompt should have this order:

1. Chapter question.
2. Intended conclusion.
3. Two or three selected atomic facts.
4. Bounded meaning for each fact.
5. One counterweight.
6. Explicit prohibited claims.
7. Ownership boundary and tone/length rules.
8. Request for prose only.

The prompt should not show:

- aggregate dispositor-chain nodes;
- the complete meaning-complex graph;
- unrelated chapter evidence;
- raw calculation metadata that is not needed for the chapter;
- every possible interpretation of a fact;
- a list of forbidden phrases standing in for a claim boundary.

The positive instruction matters. “Do not say X” is weaker than “Use these two
facts to answer this question, reach this bounded conclusion, and preserve this
counterweight.”

## Caelus local comparison experiment

The next local experiment should be read-only with respect to Astra production.
Run Caelus in a separate checkout or temporary workspace and compare the same
small set of trusted charts. Do not add Caelus to the Astra dependency graph as
part of this experiment.

### Inputs

Use at least:

- one trusted full-mode chart with reliable coordinates;
- one chart containing Moon, house, aspects, and a dispositor path;
- one chart with a known configuration such as a T-square or other multi-factor
  complex;
- one reduced calculation-mode fixture if Caelus can represent the same mode.

Keep Astra's exact birth inputs, zodiac, house system, point set, and aspect
policy in a comparison manifest. Do not compare only rendered prose.

### Capture from each engine

For each chart, record:

1. raw positions and signs;
2. house placements and cusps where applicable;
3. aspects, orb, and applying/separating state if available;
4. rulership/dispositor facts;
5. configurations and derived patterns;
6. stable IDs or equivalent source paths;
7. salience/ranking if the engine provides it;
8. provenance and certainty handling;
9. unavailable or uncertain facts;
10. any disagreement with Astra.

### Comparison decisions

The experiment should answer three separate questions:

- **Calculation parity:** Does Caelus agree with Astra on the facts that matter
  for the selected charts?
- **Evidence-surface quality:** Is Caelus's atom/provenance shape clearer for a
  writer or reviewer than Astra's current packet?
- **Adoption value:** Would using Caelus reduce risk and maintenance burden, or
  would it create a second calculation authority and a parity problem?

Do not collapse these into one score. A useful evidence surface does not imply
that the engine should replace Astra's calculations.

### Expected outcomes

There are three acceptable outcomes:

- **Reference only:** Astra's calculations are sufficiently trusted; Caelus
  informs atom IDs, provenance, and audit design.
- **Local comparison tool:** Caelus becomes a developer-only parity checker,
  never a production source of report facts.
- **Scoped integration proposal:** only if parity is strong, the license review
  is clear, and the integration removes more complexity than it adds.

The default expectation should be Reference only or Local comparison tool.

## Practical quality bar for the next report bakeoff

The goal is good quality, not sentence perfection. A fresh non-Tony bakeoff
should block only on:

- wrong or invented astrology;
- unselected evidence presented as fact;
- unqualified biography, current timing, established behaviour, relationship
  status, or another person's inner state;
- a chapter with no coherent owned conclusion;
- a report that cannot be reviewed because generation failed.

It should tolerate:

- a cautious, conditional tendency;
- minor thematic recurrence where the chapter job is still distinct;
- ordinary prose that is useful but not maximally elegant;
- a less-than-perfect salience ranking when no factual or trust boundary is
  crossed.

The evaluator should score the complete report, not only isolated sentences,
and should record whether each weakness is factual, safety-related, structural,
or stylistic. That classification prevents phrase-level fixes from becoming an
endless rollout blocker.

## Proposed next implementation goal

Implement the shared writer-packet contract behind the existing report façade.
Keep public APIs, report headings, UI, routes, database contracts, and the
current calculation engine unchanged. Produce a private comparison artifact
for the same trusted charts in Astra and local Caelus, with fact parity,
selected atoms, provenance, and disagreements. Then run one bounded report
bakeoff and decide whether Caelus is reference-only or worth a scoped local
comparison tool.

Do not import Kerykeion directly. Do not copy interpretation corpus text. Do
not adopt Zodiac Engine code based on its provisional README license. Do not use
AstrologyAPI as a source-code dependency. Do not begin Phase 6 presentation
work until the evidence-to-prose contract has a passing internal comparison.

## Completion evidence

Completed 2026-07-27 on
`codex/astra-report-engine-modularization`.

- Implemented the private fact-addressable writer packet and three-paragraph
  claim plan behind the unchanged `@astra/astrology` facade.
- Added deterministic acceptance, rejection, and public-marker-exclusion
  fixtures.
- Compared four trusted charts with Caelus `0.23.0` in an isolated checkout.
  Caelus Birth's own `toUT` verified all four instants, and Caelus returned the
  explicitly requested tropical whole-sign settings.
- Kept Caelus reference-only and outside Astra's dependency graph.
- Ran exactly one fresh Cheyenne Deep outer attempt with no operator-driven
  sentence retry and no Tony, Marissa, or Felicia generation.
- Recorded the exact evidence, score classification, attempts, cost, and
  practical GO decision in
  `docs/evaluations/ASTRA_SEMANTIC_SYNTHESIS_V2_PHASE_5_EVALUATION.md`.
- Preserved the public API, schemas, routes, headings, report contracts, and
  Phase 6 boundary.

Durable lesson: gold-in/gold-out here means selected atomic facts are not
enough by themselves. Each fact also needs one bounded semantic contribution,
one owned chapter conclusion, a counterweight, and an auditable claim job.
That improves evidence discipline without turning the customer report into a
provenance trace or the validator into a phrase blacklist.
