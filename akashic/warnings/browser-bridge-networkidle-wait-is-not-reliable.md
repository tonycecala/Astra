---
title: "Browser bridge networkidle wait is not reliable"
status: "active"
date: "2026-06-15"
updated: "2026-06-16"
tags: ["warning", "captured"]
related: []
---
# Browser bridge networkidle wait is not reliable

## What Happened
In the Codex in-app browser bridge, tab.playwright.waitForLoadState({ state: 'networkidle' }) can be rejected even though browser documentation lists networkidle. Workaround: after clicks/submits, wait for domcontentloaded or load only when navigation is expected, then assert the concrete UI state that proves success: URL, heading, form step, session panel, toast, DB/API response, or console error list. Do not repeat a submit just because networkidle failed; first inspect the DOM snapshot or a targeted locator state to avoid duplicate side effects.

## Why It Happened
The browser bridge exposes a Playwright-like API, but its supported load states are narrower than the upstream Playwright surface documented in the generated API reference. In practice, `networkidle` is not a safe synchronization primitive here. It can fail after the user action already succeeded, which makes a blind retry dangerous for forms, auth-code sends, purchase flows, saves, or any action with side effects.

## How To Avoid It
- Use `domcontentloaded` or `load` only when a real navigation is expected.
- For in-page transitions, assert the next visible state directly: heading, form step, session panel, toast, enabled button, URL, or targeted DOM snapshot text.
- For auth/email flows, pair the browser state with local evidence such as Mailpit, API/session response, or database row checks.
- If a wait call is rejected, inspect current state before retrying the click or submit.
