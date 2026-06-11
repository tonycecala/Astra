# Akashic Governance

Akashic governance is an explicit, repo-local Codex operating layer. Install it with:

```bash
ak governance install
ak governance check
```

## Attention Gate

The gate runs from `.codex/config.toml` and executes `.codex/hooks/akashic_preflight.py`. It scans:

- `akashic/agent-inbox/*.md`
- `akashic/warnings/*.md`

Any missing `status` is treated as `new`. Any `status: new` item blocks risky product work until it is updated to `acknowledged`, `acted`, `deferred`, `superseded`, or `closed`.

To prevent deadlock, the gate allows:

- edits inside `akashic/agent-inbox/`
- edits inside `akashic/warnings/`
- `ak inbox ack <message-file>`
- `ak inbox defer <message-file>`
- `ak inbox close <message-file>`

Repos without an `akashic/` directory no-op cleanly.

## Preflight

Before non-trivial edits, complete this preflight:

1. Read active `akashic/agent-inbox/` and `akashic/warnings/` items.
2. Check `git status --short`.
3. Locate the latest local REPOMAP output.
4. State the objective in one sentence.
5. State the smallest intended edit surface.
6. State the proof command or evidence target.

## Screenshot and Computer-Use Budget

Screenshots and computer-use/browser loops are allowed for visual work, layout checks, inaccessible flows, and final smoke confirmation. They should not be the first debugging reflex.

Use this inspection order first:

1. Source code
2. Git diff/status
3. Logs
4. Database/query output
5. API response, JSON, or DOM text
6. Existing tests
7. Screenshot or computer-use

Do not take more than one screenshot in a debugging loop without writing:

```text
Visual inspection required because: <reason>
Structured evidence already checked: <files/logs/tests/API/etc.>
Expected visual evidence: <what the screenshot should prove/disprove>
```

## Evidence-First Debugging

Before editing code for a bug, write:

```yaml
problem: ""
observed_evidence:
  - ""
hypothesis: ""
evidence_needed: ""
disproof_condition: ""
next_test: ""
```

Use one hypothesis and one test. Do not patch multiple suspected causes at once unless evidence already proves one shared root cause.
