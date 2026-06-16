---
title: "Composer voice templates"
status: "reference"
priority: "normal"
type: "composer-reference"
created: "2026-06-15"
updated: "2026-06-16"
tags: ["composer", "voices", "validation", "reference", "not-blocker"]
related: []
---

# Composer Voice Templates — Guide / Companion / Prompt

**Purpose:** Add three reusable short-message voice templates to Composer for headers and bodies.

**Target:** Codex / Composer implementation.

**Scope:** content generation, validation, and publishing gates for short voice cards.

---

## 1. Implementation Summary

Composer should support three selectable voice IDs:

- `guide`
- `companion`
- `prompt`

Each generated card should use this shape:

```json
{
  "voice": {
    "id": "guide"
  },
  "header": "string",
  "body": "string"
}
```

Composer must validate the result before publishing.

Core rules:

- Enforce each voice's `header_max_words`.
- Enforce each voice's `body_max_words`.
- Reject moralizing language.
- Reject each voice's banned terms.
- Regenerate once on validation failure.
- If the second attempt fails, return a structured validation error.

---

## 2. Global Composer Rules

```yaml
composer_voice_system:
  schema:
    voice:
      id: guide | companion | prompt
    header: string
    body: string

  global_constraints:
    must_not_moralize: true
    reject_on_word_limit_violation: true
    reject_on_banned_terms: true
    regenerate_attempts: 1

  moralizing_policy:
    description: >
      Moralizing means lecturing the reader with blame, shame, superiority,
      guilt, scolding, or behavior-policing language. Composer should prefer
      invitation, clarity, and practical next steps.
    banned_patterns:
      - blame language
      - shame language
      - scolding
      - guilt framing
      - superiority framing
      - "you failed"
      - "you are wrong"
      - "you need to"
      - "you must"
      - "you should have"
```

---

## 3. Voice Registry

```yaml
voices:
  guide:
    persona: Expert guide, neutral authority focused on clear steps
    pros:
      - Very actionable
      - Scales to multi-step tasks
      - Good for instructions, checklists, and next steps
    cons:
      - Can feel didactic if overused
      - Less emotional warmth
    temperature: 0.2
    header_max_words: 14
    body_max_words: 40
    tone_tags:
      - direct
      - calm
      - confident
    emotion_range: low-moderate
    avoid_terms:
      - must
      - shouldn't
      - shame
    must_not_moralize: true
    example:
      header: "Five clear steps to take next — concise, no jargon, each actionable."
      body: "Follow these exact actions tonight to collect a reusable draft for Codex."

  companion:
    persona: Empathetic companion, reflective and encouraging
    pros:
      - Builds rapport
      - Good for retention
      - Useful when emotion, reflection, or hesitation matters
    cons:
      - Less concise
      - May become overly gentle
    temperature: 0.4
    header_max_words: 14
    body_max_words: 45
    tone_tags:
      - warm
      - empathetic
      - curious
    emotion_range: moderate
    avoid_terms:
      - blame
      - shame
      - moralize
    must_not_moralize: true
    example:
      header: "Quick check-in: how did last session feel? Gentle, practical next-step suggestions."
      body: "Noticing progress matters — two tiny actions you can try tonight."

  prompt:
    persona: Task nudge, compact and experiment-focused
    pros:
      - Fast to read
      - Great for A/B testing
      - Works well for micro-actions and experiments
    cons:
      - May lack context
      - Can feel terse
    temperature: 0.1
    header_max_words: 14
    body_max_words: 30
    tone_tags:
      - energetic
      - concise
      - provocative
    emotion_range: low
    avoid_terms:
      - always
      - never
      - should
    must_not_moralize: true
    example:
      header: "Small prompt: one bold idea to try in 10 focused minutes for immediate feedback."
      body: "Try this micro-experiment and log the result; keep it under one paragraph."
```

---

## 4. Validation Contract

Composer should validate output with deterministic checks.

```yaml
validation:
  word_count:
    header:
      guide: 14
      companion: 14
      prompt: 14
    body:
      guide: 40
      companion: 45
      prompt: 30

  banned_terms:
    global:
      - shame
      - blame
      - guilt
      - failed
      - wrong
      - "you need to"
      - "you must"
      - "you should have"
    guide:
      - must
      - shouldn't
      - shame
    companion:
      - blame
      - shame
      - moralize
    prompt:
      - always
      - never
      - should

  validation_flow:
    - Generate candidate.
    - Count words in header and body.
    - Scan case-insensitively for banned terms.
    - Scan for moralizing patterns.
    - If valid, publish.
    - If invalid, regenerate once using the same voice ID and constraints.
    - If still invalid, return error.
```

Suggested error shape:

```json
{
  "ok": false,
  "error": "VOICE_VALIDATION_FAILED",
  "voice_id": "guide",
  "violations": [
    {
      "field": "header",
      "type": "WORD_LIMIT",
      "limit": 14,
      "actual": 17
    }
  ]
}
```

---

## 5. Generation Instructions

When Composer receives `voice.id`, it should apply that voice's constraints.

```yaml
generation:
  input:
    voice_id: guide | companion | prompt
    topic: string
    context: string optional
    desired_action: string optional

  output:
    voice:
      id: selected_voice_id
    header: short message header
    body: short message body

  rules:
    - Do not include markdown unless explicitly requested.
    - Do not explain the voice choice in the user-visible output.
    - Do not moralize.
    - Do not exceed word limits.
    - Prefer concrete verbs.
    - Prefer one clear action over several vague actions.
```

---

## 6. Immediate Test Fixtures

Use these to verify validation and rendering.

```yaml
fixtures:
  valid:
    - voice_id: guide
      header: "Five clear steps to take next — concise, no jargon, each actionable."
      body: "Follow these exact actions tonight to collect a reusable draft for Codex."

    - voice_id: companion
      header: "Quick check-in: how did last session feel? Gentle, practical next-step suggestions."
      body: "Noticing progress matters — two tiny actions you can try tonight."

    - voice_id: prompt
      header: "Small prompt: one bold idea to try in 10 focused minutes for immediate feedback."
      body: "Try this micro-experiment and log the result; keep it under one paragraph."

  invalid:
    - voice_id: guide
      reason: banned term
      header: "You must fix this now"
      body: "This uses banned guide language."

    - voice_id: companion
      reason: moralizing
      header: "You should feel bad about missing this"
      body: "This uses shame and guilt framing."

    - voice_id: prompt
      reason: banned term
      header: "Always do this one thing"
      body: "This uses a banned prompt term."
```

---

## 7. Suggested Composer API Surface

```ts
type ComposerVoiceId = "guide" | "companion" | "prompt";

type ComposerVoiceCard = {
  voice: {
    id: ComposerVoiceId;
  };
  header: string;
  body: string;
};

type ComposerVoiceValidationError = {
  ok: false;
  error: "VOICE_VALIDATION_FAILED";
  voice_id: ComposerVoiceId;
  violations: Array<{
    field: "header" | "body";
    type: "WORD_LIMIT" | "BANNED_TERM" | "MORALIZING";
    limit?: number;
    actual?: number;
    term?: string;
  }>;
};
```

---

## 8. Acceptance Criteria

Composer implementation is complete when:

- `guide`, `companion`, and `prompt` can be selected by `voice.id`.
- Each voice uses its assigned temperature.
- Headers and bodies respect word caps.
- Voice-specific banned terms are rejected.
- Global moralizing language is rejected.
- Invalid generations regenerate once.
- Repeated failure returns a structured validation error.
- Fixtures above pass as expected.

---

## 9. Non-Goals

Do not build a full brand voice system yet.

Do not add long-form copy voices.

Do not infer user psychology.

Do not create hidden fallback voices.

Do not silently switch voices when validation fails.

---

## 10. Codex Task

Implement the Composer voice registry and validation gate described above.

Recommended files are project-dependent, but the preferred shape is:

```text
composer/
  voices/
    registry.ts
    validateVoiceCard.ts
    generateVoiceCard.ts
    __tests__/
      validateVoiceCard.test.ts
```

Keep this small, deterministic, and easy to test.
