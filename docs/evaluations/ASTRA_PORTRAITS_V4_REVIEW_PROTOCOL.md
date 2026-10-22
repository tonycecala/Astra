# Portraits V4 — independent reader review

Status: **frozen before candidate review**, 2026-09-19 UTC. Version: `portraits-v4-reader-review-1`.

This is the reader-review part of the V4 experiment, adapted from the ScienceOfficer preregistration. It is not a declaration that the writing or release has passed. The independent reviewer owns this protocol and private decisions, not the generator or production code.

## Decision

Would a reader receive a clear, perceptive, worthwhile Personal, Relationship, or Life Chapter portrait at the standard Tony approved in his July 18 Core and recent Synastry reports?

The unit is one **complete generated report**, including the ending. Transport success, valid structure, correct chart calculations, and an attractive opening cannot substitute for that decision. The primary endpoint is the report-level accept/hold decision below; dimension scores explain it, not an additional collection of success claims.

The three topics share one literary standard. Relationship keeps its successful writing approach. Topic-specific evidence and factual boundaries remain different. A report is profound when it develops a meaningful tension and changes how the reader can understand it—not when it is long, dramatic, flattering, or categorically certain.

## Inputs and separation

- Calibration: complete owner-approved Core and psychology-first Synastry, plus the failed Donna report. Approval is a voice reference, not permission to inherit any unsupported claim in an old report.
- Candidates: the final text readers would see, subject/reader role, authorized relationship context or target date, and a separate evidence/meaning packet. Include enough source material to assess interpretation without requiring astrology exposition in the report.
- Withhold from the reviewer: generator/model identity, candidate version, prompt changes, implementation commentary, cost, and another judge's scores until the decision is sealed.
- Random, neutral candidate IDs are assigned by the run owner before delivery. Identity cannot be completely blinded where the story reveals a subject; record that limitation. Do not call a comparison fully blind when baseline prose is recognizable.
- First read the complete report as a reader. Then inspect its supplied meaning and context for material unsupported claims. Do not let a large evidence inventory reward a poor reading.
- Keep names, birth details, private readings, source packets, mask keys, and detailed reviews in ignored private artifacts. This reviewer makes no external model calls and does not write the database.

The run owner freezes the actual generation matrix, model/provider routes, source hashes, exact production-path proof, and budget in the run manifest before calls. Those are operational requirements, not fields the reader invents after seeing good prose.

## Reader rubric

Score each dimension from 1 to 5, with half points allowed. The common anchors are: **1** absent or harmful; **2** substantially weak; **3** competent but ordinary/uneven; **4** strong throughout; **5** exceptional and sustained. A score of 5 is not required in every dimension.

| Dimension | Weight | What a strong report does |
| --- | ---: | --- |
| Psychological insight | 30% | Connects competing needs, shows how a strength can become a difficulty, and offers a genuinely illuminating distinction. Interpretation goes beyond labels or slogans. |
| Grounded specificity | 25% | Develops distinctive meaning supplied for this person/pair/period. The main ideas cannot simply be transplanted to every other subject. It need not mention technical chart facts to be grounded. |
| Coherence and development | 20% | Has a governing idea, real movement between sections, useful counterweights, and an earned ending. Sections deepen the portrait instead of restarting it. |
| Voice and clarity | 15% | Sounds direct, humane, adult, and easy to understand. Neither a defensive affidavit, astrology lecture, therapy diagnosis, motivational poster, nor purple prose. |
| Usefulness | 10% | Leaves the reader with a memorable understanding and a few usable distinctions/questions—not instructions to become a better person or generic habits. |

Calculate `weighted_score = .30*insight + .25*specificity + .20*coherence + .15*voice + .10*usefulness` without rounding before applying the threshold.

## Separate integrity gates

Any **material** violation holds the report regardless of literary score:

1. Wrong subject, selected reader, relationship context, chart fact, or dated basis that materially changes the reading.
2. Invented biography, trauma, diagnosis, actual relationship history, attributed speech, or established private behavior presented as known. Explicitly hypothetical examples and metaphors are not automatically violations.
3. Claims of another person's actual desire, consent, commitment, feelings, or reciprocity without that information. Respect the authorized relationship lens; attraction symbolism may support discussion of potential chemistry, not proof that someone wants the reader.
4. Guaranteed future events, precise timing not supported by the dated source, or a Life Chapter reading that quietly substitutes natal material for the requested changing period.
5. Private evidence IDs, internal instructions, prompts, debug metadata, or another person's unrelated private information exposed in the reader's prose.

For a gate failure, cite the smallest decisive passage and identify what source/context is missing or contradicted. Suspicion alone is not a hard failure: record `grounding unresolved` and request the missing packet. A missing packet prevents a final grounded-quality decision; it does not prove the writer fabricated anything.

**Do not recreate the original defensive failure.** A symbolic portrait may directly describe a pattern or plausible inner tension. It does not need “may,” “might,” or a disclaimer in every sentence. One brief framing note, meaningful conditional language where necessary, and omission of fabricated specifics can coexist with vivid interpretation. Confidence is neither a quality bonus nor an automatic failure.

## Editorial failure probes

These probes inform the rubric rather than act as brittle keyword quotas:

- **Defensive non-writing:** does the prose repeatedly retract its own insight, describe only what cannot be known, or explain the writer's evidence limitations instead of the person?
- **Astrology exposition:** if the placement names disappeared, would there still be a real psychological reading? A short illuminating chart reference is welcome; a placement inventory is not the product.
- **Bland universality:** identify two report-defining insights and their source meanings. Could the same passages fit the other cohort members with names changed? Universal human material is acceptable when the particular combination and consequences are developed.
- **Repetition:** distinguish purposeful return with new meaning from the same opposition, advice, or three-paragraph formula repeated. Cross-report repeated phrasing is a diagnostic, not proof of plagiarism.
- **Performance of profundity:** strip the grand metaphor. Does an intelligible, grounded idea remain? Emotional intensity cannot rescue an empty or invented claim.
- **Relationship balance:** both people and their interaction should be intelligible without erasing the chosen reader or pretending to know the other person's biography. Do not require identical name counts or word allocations.
- **Life Chapter relevance:** what is changing or emphasized now, how does it relate to the person's enduring patterns, and what can the reader notice or choose? “A season of transformation” alone fails specificity.

No automatic pass or fail comes from length, astrology-word counts, names-per-paragraph, readability score, or number of sources mentioned. Those may point to passages worth reading.

## Qualification before primary decisions

The reviewer first reads all three full calibration reports and records a short assessment. The approved references must clearly outrank the failed Donna report in the mean of insight, coherence, and voice (at least **1.0 point** for each approved reference). The failed report must be held for its observed literary defects. If not, stop: the reviewer has not demonstrated the distinction being repaired. Do not lower the gate to qualify the reviewer.

The run owner additionally supplies **eight short, independently keyed controls**, shuffled and without answer labels. They may be preserved historical passages or deliberate mutations with known source/context. The reviewer must:

1. Identify an unsupported literal biography/attributed-speech insertion.
2. Identify a relationship-context or actual-consent/reciprocity violation.
3. Identify unsupported precise timing or a wrong-date interpretation.
4. Identify an exposed private evidence token or instruction.
5. Identify chart-fact/defensive prose that withholds human meaning.
6. Identify a polished but interchangeable universal passage as low specificity.
7. Allow a vivid, supported psychological interpretation without demanding sentence-by-sentence disclaimers.
8. Allow an explicitly hypothetical example/metaphor without misclassifying it as known biography.

All four integrity controls and both permissible-interpretation controls must be correct; at least **7 of 8 overall** must be correct. Any failed endpoint gate prevents primary decisions for that endpoint. Preserve the failure. Clarifying the protocol after a failed gate requires a new version and fresh controls, not another judgment on the same key. Calibration and control scores do not enter candidate results.

## Acceptance and comparisons

**A report passes reader review only when** all integrity gates pass, all five dimensions are at least **4.0**, and the weighted score is at least **4.2**. Report one concise reason, the two strongest passages/insights, and at most three decisive weaknesses. Do not force three criticisms when none materially matters.

For Tony's Personal candidate, compare the complete reading with the approved Core after independently scoring both: it must be at least equivalent overall, with no material loss of psychological insight or readable voice. Different subject reports are judged against the calibrated standard, not required to imitate Tony's themes. Relationship candidates must preserve the approved psychological experience; prettier wording that loses relational specificity is a regression. Keep pairwise preference as an explanation, not a way to overrule an integrity failure or a failed absolute threshold.

For the tested matrix to pass, **every required candidate must pass**; an average cannot hide one bad customer reading. Review all generated primary outputs, not only a hand-picked winner. At minimum cover Personal and Life Chapter for Tony, Donna, and Cheyenne; Relationship pairs and contexts must be explicitly fixed by the run owner, never inferred from charts. Include an independently generated repeat on each materially changed writing path before claiming consistency. Repeat calls are separately planned units, not reruns of accepted observations.

Any missing required type, subject, repeat, grounding packet, or normal-customer-path proof produces `INCOMPLETE`, not a whole-system pass. Safety behavior not represented in paid real-person samples can be checked separately using deterministic/synthetic fixtures; do not claim those are live reader-quality samples.

## No-go and iteration

- `PASS — ready for owner review`: the report meets the rubric and integrity gates. This does not authorize publication, replacement of historical reports, deployment, or contact with customers.
- `HOLD — reader quality`: a dimension or weighted score misses the bar. Explain the smallest meaningful defect; do not redesign the system by reflex.
- `HOLD — integrity`: identify the actual unsupported or wrong claim and the source boundary.
- `INCOMPLETE — missing proof`: unable to reach a grounded or operational decision with the supplied artifacts.

Seal each accepted review with the report hash, protocol version, scores, gates, decision, and timestamp. Do not regrade it merely to manufacture a pass. A revised generated report is a new unit with a new ID and preserved lineage. Preserve rejected outputs and real costs. After two failed revisions of one case/path, report the unresolved defect and stop treating more sampling as proof; the owner decides whether another narrowly specified experiment is warranted.

The $30 OpenRouter cap belongs to the run owner and includes all newly authorized generator/editor/evaluator calls. This reviewer spends $0 externally. No extra provider or disclosure route is authorized by this protocol. If the cap prevents required coverage, deliver the honest partial result; do not silently drop difficult cases.

## Limits and private review record

This is a small, purposeful product-quality assessment, not proof of astrological or psychological scientific validity and not a population estimate of failure rates. One independent agent reduces implementer self-grading; it is not a substitute for Tony's own reader judgment. A good result supports this tested version and matrix, not every future output.

Each private review records: candidate ID and hash; supplied-context/evidence hashes; protocol version; calibration/qualification status; five scores and exact weighted result; integrity pass/fail/unresolved with a brief quotation; defining insights; decisive weaknesses; overall decision; comparison where applicable; and material masking limitations. The final batch summary separately reports reader quality, integrity, missing cases, and operational-path proof.

Protocol changes after candidate exposure require a clearly labeled new protocol and new prospective test. They cannot relabel these accepted observations.
