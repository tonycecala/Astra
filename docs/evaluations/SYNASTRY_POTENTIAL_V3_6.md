# Synastry V3.6: romantic potential, naturally expressed

September 19, 2026. Owner-directed prompt adjustment in the existing portraits worktree. No deployment or paid generation.

## The decision

A request about a Lover gives the report a legitimate romantic purpose. Explore attraction and desire without repeatedly questioning the premise. The other person's actual response remains unconfirmed; describe what can or may arise rather than treating the chart as proof that it has arisen.

For example, “the pull moves in both directions” becomes “the pull can be mutual.” “She feels seen” becomes “she may feel seen.” These illustrate the instruction; they are not manually revised production outputs or a required phrase template. No probability estimate is inferred from the request.

## The smallest adjustment

The existing writer and semantic-review prompts now share one brief for natural possibility language. A local conditional frame can support a connected passage without putting “may” in every sentence. The reviewer is explicitly told that a plausible, evidence-grounded feeling is not an unsupported claim simply because it is unobserved. It still checks factual support and distinguishes possible attraction from asserted reciprocation. Modal words do not excuse contradicting the source or presenting rejection as encouragement.

The Lover-specific context is scoped to its normalized tag. Family, professional and observational restrictions stay in place. Existing source evidence, private trace, parser, severity policy, retry limits, models and reasoning settings are unchanged. Synastry remains writer → semantic review, with two calls on ordinary success. There is no new editor, style counter or automatic replacement rule.

New generations carry `astra-synastry-v3.6-relationship-potential-2026-09`. Historical V3.5 reports and the current Personal report are preserved. The [flow diagram](../architecture/REPORT_WRITING_FLOW.md) reflects the new prompt version.

## Validation and review

Luna added focused assertions to the existing engine smoke test and ran:

- `npm run test:synastry-v3-engine`, `npm run test:synastry-v3-packet`, `npm run test:synastry-v3-validation`, and `npm run test:ally-tone-routing`: passed.
- Focused ESLint on the changed source/test, `npm run typecheck`, and `npm run build`: passed.

The mocked writer/reviewer requests contain the revised guidance. Lover-specific context is absent from Family, Business and Public Figure prompts. Existing evidence/trace guards, semantic failure handling, two-call success, usage totals and absence of a paid editor remain covered. Source requests and saved report artifacts were not modified.

No route, layout, interface state or analytics changed. Browser tests were not rerun because the existing report fixtures require database writes; this remains prompt/engine verification, not a fresh rendered or paid-model qualification. Repository-wide lint's existing ignored experiment-runner errors were not re-audited.

Steward review of the actual source/test/documentation diff: **accept with notes**. The change matches Tony's intended distinction without new model calls, lexical gates or severity-policy changes. The important limit is that mocked tests establish propagation and unchanged processing, not that a live writer now consistently expresses uncertainty well. That remains observable in the next authorized generation. The existing relationship-label warning and verification playbook were clarified rather than creating a duplicate lesson. The inherited Synastry evaluation edit is unchanged; recorded API spend remains $8.436220.
