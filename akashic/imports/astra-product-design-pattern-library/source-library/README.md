# Astra Product Design Pattern Library

Generated from the flattened text version of **The Product Design Playbook** and translated into Astra-specific implementation skills.

## Purpose

This library converts product-design plays into concrete Astra product skills for:

- onboarding
- activation
- Stream design
- Library design
- retention
- trust
- paid reports
- mobile widgets
- growth
- ethical engagement

## North Star

Astra should not become a gamified astrology toy.

Astra should become a **meaningful daily companion** that reduces friction, increases relevance, preserves user autonomy, and helps the Explorer build a durable record of their symbolic journey.

## Pattern Index

| Priority | Pattern | Astra Area |
|---|---|---|
| critical | [Time to Value](patterns/01-time-to-value.md) | onboarding, activation |
| critical | [Sandbox Experience](patterns/02-sandbox-experience.md) | onboarding, conversion |
| critical | [Discovery](patterns/03-discovery.md) | stream, composer |
| critical | [Personalisation](patterns/04-personalisation.md) | composer, stream |
| critical | [Progressive Disclosure](patterns/05-progressive-disclosure.md) | ui, education |
| high | [Setup Defaults](patterns/06-setup-defaults.md) | onboarding, empty states |
| critical | [Empty States](patterns/07-empty-states.md) | library, allies, gifts |
| critical | [Success Moments](patterns/08-success-moments.md) | ritual, retention |
| critical | [Value Replay](patterns/09-value-replay.md) | retention, notifications |
| critical | [Effort Moat](patterns/10-effort-moat.md) | library, retention |
| high | [Investment](patterns/11-investment.md) | profile, library |
| high | [Commitment](patterns/12-commitment.md) | onboarding, habit |
| high | [Intent Mirroring](patterns/13-intent-mirroring.md) | composer, ui |
| high | [Momentum Bias](patterns/14-momentum-bias.md) | onboarding, courses |
| critical | [Pattern Alignment](patterns/15-pattern-alignment.md) | ui architecture |
| medium | [Micro Interactions](patterns/16-micro-interactions.md) | experience refinement |
| high | [Loading Feedback](patterns/17-loading-feedback.md) | ai generation, reports |
| medium | [Perceived Effort Delay](patterns/18-perceived-effort-delay.md) | premium reports |
| high | [Intentional Friction](patterns/19-intentional-friction.md) | trust, purchase, destructive actions |
| critical | [Fail Safe](patterns/20-fail-safe.md) | trust, data safety |
| high | [Permission Serve](patterns/21-permission-serve.md) | notifications, contacts |
| high | [System Widget](patterns/22-system-widget.md) | mobile retention |
| critical | [Deep Link](patterns/23-deep-link.md) | notifications, email, share |
| medium | [Shareability](patterns/24-shareability.md) | growth, identity |
| low-medium | [Referral](patterns/25-referral.md) | growth |
| dangerous | [Contact Bridge](patterns/26-contact-bridge.md) | social, privacy |
| adapt-carefully | [Gamified Progress](patterns/27-gamified-progress.md) | gifts, courses, stars |
| dangerous | [Variable Reward](patterns/28-variable-reward.md) | stream, discovery |
| adapt-carefully | [Spark Curiosity](patterns/29-spark-curiosity.md) | reports, onboarding |
| high | [The Paywall](patterns/30-the-paywall.md) | monetization |
| dangerous | [Limited Offer](patterns/31-limited-offer.md) | conversion |
| critical | [JTBD Copywriting](patterns/32-jtbd-copywriting.md) | copy system |
| medium | [Small Quirk](patterns/33-small-quirk.md) | brand identity |
| high | [Premium Positioning](patterns/34-premium-positioning.md) | reports, paid tiers |
| adapt-carefully | [Growth and Viral](patterns/35-growth-viral.md) | marketing |
| critical | [Trust Building](patterns/36-trust-building.md) | privacy, spirituality, ai |

## How Codex Should Use This Library

1. Read `codex_inbox/ASTRA_PRODUCT_PATTERN_LIBRARY_CODEX_BRIEF.md`.
2. When implementing a feature, identify the relevant pattern file(s).
3. Apply the acceptance criteria inside the pattern.
4. Add instrumentation named in the metrics section.
5. Do not implement dark-pattern variants.
6. Add tests for empty/loading/error/success states.

## Highest-Leverage Astra Cluster

Start here:

1. Time to Value
2. Sandbox Experience
3. Discovery
4. Personalisation
5. Progressive Disclosure
6. Empty States
7. Success Moments
8. Value Replay
9. Effort Moat
10. Trust Building

These ten are the core of Astra’s product soul.
