# Astra Report Model Strategy - July 2026

Status: Approved by measured bakeoff

## Decision

- Production writer: `anthropic/claude-sonnet-5`
- Operational fallback: `google/gemini-3.5-flash`
- No customer-facing model selector or premium model tier
- Keep `openai/gpt-5.6-terra`, `openai/gpt-5.6-sol`, `anthropic/claude-opus-4.8`, and `anthropic/claude-fable-5` available only for admin bakeoffs
- Keep chart evidence, section requirements, validation, and provenance owned by Astra code. The model remains the prose writer.

The production profile selects Sonnet 5 by default. Gemini 3.5 Flash is the approved explicit override when Sonnet is unavailable or a controlled cost/latency fallback is needed; runtime provider failover is not automatic.

## Evaluation Design

All candidates received the same Tony birth-data fixture, Tropical zodiac, Whole Sign houses, calculated chart evidence, section contract, and prompt version (`astra-report-writer-2026-07`). Identity was tested across six candidates. Core and Deep were then tested across the three viable production candidates.

The durable model runner is `npm run report:quality-bakeoff`. Prompt-contract changes use `npm run report:prompt-bakeoff` for the six-family private before/after set and `npm run report:prompt-compare` for the metric comparison. The runners write ignored private artifacts and record tokens, provider spend, latency, retries, word count, section distinctness, repeated-sentence rate, chart specificity, practical language, and retained prose.

## Observed Results

These costs are one live OpenRouter sample on July 16, 2026. They include validation retries and should be treated as observed run cost, not a guaranteed quote.

| Model | Identity | Core | Deep | Three-report total | Total latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sonnet 5 | $0.0137 | $0.0804 | $0.0528 | $0.1469 | 181 sec |
| Gemini 3.5 Flash | $0.0076 | $0.0174 | $0.0630 | $0.0879 | 81 sec |
| GPT-5.6 Terra | $0.0114 | $0.0701 | $0.1629 | $0.2444 | 186 sec |

Identity-only premium comparison:

| Model | Cost | Latency | Result |
| --- | ---: | ---: | --- |
| Claude Opus 4.8 | $0.0583 | 34 sec | Good, but required a retry and did not beat Sonnet |
| GPT-5.6 Sol | $0.0252 | 33 sec | Solid, but slower with no clear prose advantage |
| Claude Fable 5 | $0.0792 | 25 sec | Specific, but roughly 5.8x Sonnet's Identity cost without proportional value |

## Quality Finding

Sonnet showed the strongest controlled depth progression:

| Tier | Words | Sections | Specificity / 1,000 words | Practical sentences | Attempts |
| --- | ---: | ---: | ---: | ---: | ---: |
| Identity | 531 | 1 | 33.9 | 5 | 1 |
| Core | 1,255 | 4 | 39.8 | 11 | 2 |
| Deep | 1,874 | 9 | 50.7 | 21 | 1 |

The blind read found Sonnet the most psychologically useful and least textbook-like. It synthesized tensions instead of merely enumerating placements, kept sections differentiated, and made Deep feel broader and more specific rather than merely longer.

Gemini was the best operational fallback: substantially faster and cheaper overall, with valid tier progression, but more formulaic language and a tendency toward excess length in Deep. Terra was often practical, but it became the longest, slowest, and most expensive of the finalists because validation retries amplified both latency and spend.

## Cost Judgment

At the observed sample cost, writer spend remains small relative to Astra's 1/5/10-Star product prices. Sonnet earns the production role on quality. A separate premium writer tier does not currently earn its UX complexity or cost: the expensive candidates did not produce a meaningful quality step beyond Sonnet.

## Operational Rules

1. Persist actual provider, model, profile, prompt version, attempts, tokens, spend, and latency with every generated result.
2. Show compact provenance in Library; keep detailed generation telemetry admin-only.
3. Time out an individual provider call after 90 seconds.
4. Re-run this bakeoff on the same fixture before changing the production writer or prompt contract.
5. Judge new candidates blind on psychological usefulness, specificity, freshness, section differentiation, and whether tier depth earns the price.
6. Submit an explicit reasoning policy on every OpenRouter prose call. Use `none` for Sonnet and other prose-first writers; use `minimal` only where the provider requires it.
7. Retain rejected monolithic and sectioned prose, validation reasons, provider usage, and latency in private telemetry.

## Pricing Sources Reviewed

- OpenAI models: https://developers.openai.com/api/docs/models
- Anthropic models and pricing: https://platform.claude.com/docs/en/about-claude/models/overview and https://platform.claude.com/docs/en/about-claude/pricing
- Gemini models and pricing: https://ai.google.dev/gemini-api/docs/models and https://ai.google.dev/gemini-api/docs/pricing
