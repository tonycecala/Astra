---
title: "Report prose budgets and prompt contracts"
type: "decision"
description: "Diagnose report execution budgets before rewriting prompts, and keep one authoritative contract per prompt concern."
status: "accepted"
project: "Astra"
created: "2026-07-17"
date: "2026-07-17"
updated: "2026-07-17"
timestamp: "2026-07-17"
okf_version: "0.1"
tags: ["adr", "reports", "prompts", "llm", "telemetry", "plainspoken"]
related:
  - "docs/architecture/ASTRA_REPORT_PROMPT_REVIEW.md"
  - "docs/decisions/ASTRA_REPORT_MODEL_STRATEGY_2026-07.md"
---
# ADR: Report prose budgets and prompt contracts

## Date
2026-07-17

## Status
Accepted

## Decision
Astra prompt v6 proved that a report failure can come from the execution contract rather than weak prose instructions. Sonnet Core repeatedly failed when hidden reasoning consumed the visible completion budget; explicitly setting reasoning.effort to none produced a complete 1,076-word four-chapter Core report on the first attempt without raising token limits, weakening depth gates, splitting orchestration, or changing models. Diagnose provider finish reason, reasoning tokens, retained rejected prose, latency, and spend before rewriting prompts. Keep voice, evidence fidelity, interpretive usefulness, and product depth in one authoritative contract each: duplicated near-equivalent instructions create mechanical prose and consume context without adding safety. Use explicit family word bands to protect the Welcome-to-Identity-to-Core-to-Deep value ladder, keep readability advisory rather than a paid retry gate, and retain rejected prose plus economics privately so future validator changes are evidence-led.

## Context
Prompt v5 produced strong prose in several report families but repeatedly failed the four-chapter Core Report. The apparent symptom was insufficient visible output. A controlled v5-to-v6 comparison used the same Tony chart, settings, report families, production route, and report depth expectations. Telemetry showed that Sonnet's provider-side reasoning could consume completion tokens before the customer-visible report was complete. The older monolithic failure path also discarded rejected prose and provider economics, making the incident harder to diagnose.

## Alternatives
1. Raise output limits. Rejected because the existing Core depth was reasonable and the unused reasoning budget was the proven constraint.
2. Lower Core depth floors. Rejected because it would weaken the product to accommodate an execution artifact.
3. Split Core into section-level orchestration. Rejected as unnecessary complexity; Deep needs sectioning because of its premium nine-chapter scope, while Core completed monolithically once its visible budget was protected.
4. Change the production model. Rejected because Sonnet remained the strongest quality choice and succeeded when called with the correct execution policy.
5. Add more prompt warnings. Rejected because repeated evidence, practical-use, and voice instructions were already making the prompt longer and the prose more mechanical.

## Consequences
- Every OpenRouter report call sets reasoning effort explicitly: `none` for Sonnet and prose-first writers, `minimal` only where required by Gemini 3.5 Flash.
- Whole-report and sectioned failures retain rejected prose, structured reasons, token usage, spend, finish reason, and latency privately.
- Voice, evidence fidelity, interpretive usefulness, and family depth each have one authoritative prompt contract.
- Paid Identity, Core, Progressed, and Synastry use explicit target and hard word bands; Welcome and Deep retain their established ranges.
- Readability remains evaluation telemetry, not a retry gate that purchases another completion merely to satisfy a formula.
- Future report failures must be diagnosed from execution telemetry before prompts, models, orchestration, or quality floors are changed.

## Evidence

With the same Sonnet route and Tony chart, v6 Core completed on its first attempt at 1,076 words, estimated grade 7.9, 31.6 seconds, and $0.0259. The complete v6 six-family set finished first-pass for $0.1744 in 137.4 seconds. The retained v5 set took 200.3 seconds, completed five families, failed Core, and cost $0.1885 excluding the failed Core spend that the old path did not preserve.
