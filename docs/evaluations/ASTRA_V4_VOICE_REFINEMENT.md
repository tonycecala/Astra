# V4.8 voice refinement — bounded local work

Owner request, September 19: reuse TrueByline's anti-model-default machinery; make the reports one or two grade levels easier; expose and relax editorial caution about psychological inference. Test only Tony Personal, Tony Life Chapter and Tony–Cheyenne romantic Synastry. Originals, TrueByline, hosted data and saved reports remain unchanged. No deployment or new dependency.

## Scope fixed before new calls

One fresh production-path reading of each specified topic, with the same saved birth snapshots, settings and September 18 Life Chapter date as the approved references. This is an owner-directed revision sample, not a blinded study or a claim that any single changed rule caused improvement. Main agent judges the whole writing and evidence; Luna handles finding, metrics and fixtures. No numeric reader-grade inflation or regrading of the prior cohort.

Keep the existing OpenRouter private route and cumulative $30 ledger. This pass has a tighter **$2 additional ceiling**, beginning at $3.534705. No new model stage; the existing editor receives the prose signals. No full-cohort repeat. At most one focused repair of a genuinely failed target, then report the remaining limitation rather than sampling until lucky.

Compare body-only Flesch Reading Ease and Flesch–Kincaid grade using the existing `flesch-kincaid-en-us-v1` implementation in `packages/astrology/src/readability.ts`. Corrected baselines: Personal grade 9.4, Life Chapter 9.0, Synastry 13.6. The first clerical figures (9.5/9.2/13.7) included headings; the reusable CLI corrects that measurement mismatch before judging new prose. Aim approximately one or two grades lower, preserving depth; metrics are heuristic diagnostics, not comprehension scores or rejection gates. Counts exclude headings and private evidence. Formula reference: [Microsoft's readability documentation](https://support.microsoft.com/en-us/word/get-your-document-s-readability-and-level-statistics-in-microsoft-word).

## What is actually reused

`portraitVoice.ts` ports TrueByline `scripts/editorial_room_v3.py`'s six `MODEL_CLICHE_SIGNALS` and exact-span advisory detection. It adapts the `cliche_hunter` contract from `scripts/editorial_room_v2.py`: identify the literal passage and its missing rhetorical function, then judge against the actual source and voice. Astra adds targeted contrast-frame and automatic-reassurance signals. These are transparent extensions, not falsely attributed existing TrueByline features. No regex rewrites, phrase blacklist, Tony profile or corpus import. Astra's approved readings and Tony's current brief remain the sole voice authority.

Writer instructions now reduce repeated antithesis, triads and mirrored reaction menus; use plainer verbs and shorter natural sentences; preserve sharp interpretation. Personal/Life Chapter is version V4.8; the retained Synastry architecture gets a V3.2 prompt revision. Existing evidence calculation, selection, traces, models, call bounds and private routing stay intact.

## Interpretive boundary

Allow pointed inferred motives, generalized learned defenses, and uncomfortable observations without compulsory reassurance. Preserve actual fact/context/source-role accuracy, no invented specific event or diagnosis, no claim to know another person's consent or private feelings, and no promised future event. The Personal/Life gate now receives the same authorized question/context as the writer/editor, avoiding false invention findings for user-supplied context.

An executable Synastry keyword rule was confirmed to reject generalized “learned early,” “old wounds,” and “unconscious pattern” language. A regression first reproduced that false factual failure. Those phrases now create private advisories; specific relationship-history/fate/dialogue and semantic failures still retain their prior protection. Existing report artifacts are not rewritten.

Private before/after cuts and retained provocative passages: `.astra-exports/portraits-v4/style-refinement/EDITORIAL_BOUNDARIES.md`. Owner-facing readings and every marked edit: `.astra-exports/portraits-v4/style-refinement/REVIEW.md`.

## Final outcome and Steward review

**Accept-with-notes for local implementation and owner-calibration samples; not a deployment or fully autonomous writing qualification.** Actual diff review found the intended bounded changes: shared advisory craft rules, clearer interpretive permission, generalized Synastry inference demoted from keyword-fatal to advisory, offline metrics, and regression coverage. No source calculations, saved reports, price policy, or public/private reader boundary changed in this iteration.

Body-only grades (baseline → new model draft → final editorial copy): Personal 9.4 → 7.8 → 7.4; Life Chapter 9.0 → 7.8 → 7.4; TC–CA 13.6 → 10.6 → 10.2. Main agent read all three complete new outputs. Residual formulaic contrasts justified one disclosed exact-span manual edit pass using the existing bounded edit implementation. Final revisions changed approximately 16.1%, 14.8%, and 16.6% of words. Their private editorial JSON preserves parent and final hashes, exact spans, and style versus interpretive-judgment categories. Relationship still has no automatic prose-edit stage; these final copies cannot substantiate a claim that every future generation will match them.

One Personal attempt failed because otherwise complete editor JSON omitted its final brace. The failure remains in the original cohort; a single permitted Personal retry completed. V4.8.1 now retries SyntaxError/ZodError within the existing two-edit limit on the same draft, without guessing missing JSON or adding calls beyond that limit. Deterministic fixtures prove recovery and bounded exhaustion. Original cohort inspection correctly reports FAIL (one failed, two completed); focused retry inspection reports PASS. Source drift remains visible because mechanical recovery and later advisory-detector changes followed paid acquisition; frozen manifests were not rewritten.

OpenRouter spend: prior $3.534705; final cumulative $4.299221; this refinement $0.764516. All reservations settled. No further paid generation needed for this owner review.

### Validation receipt

- `npm run test:portrait-prose`: passed; signal spans, contrast forms, advisory status, body-only parsing, empty/missing/bad inputs, and CLI exit codes.
- `npm run test:portraits-v4`: passed, including malformed editor JSON recovery/exhaustion.
- Synastry V3 validation and engine smoke suites: passed, including generalized inference versus specific assumed history.
- `npm run typecheck`: passed.
- `npm run lint`: passed with the existing unrelated `_staleNote` warning.
- `npm run build`: passed after the final runtime/detector changes.
- `node --env-file=/Users/tony/Documents/Projects/Astra/apps/astra-web/.env.local /tmp/portraits-v4-qa.mjs npm run test:e2e:all -- portraits-v4.spec.ts synastry-v3-production.spec.ts --output .astra-exports/portraits-v4/style-refinement/browser-qa`: 9/9 passed using isolated local QA data and automated Better Auth sessions; desktop/tablet/mobile captures preserved. Production reader/report controls and owner/public separation verified by Playwright. These fixture-driven checks do not grade model-written prose.

No live deployment or hosted-data verification was performed or authorized. No independent new adversarial literary score was commissioned for this bounded owner-directed refinement. Remaining interpretive caution is explicitly marked for Tony, especially intuition-as-accuracy and assumed relationship history. Reusable procedure is captured in the existing verification playbook rather than a duplicate lesson artifact.
