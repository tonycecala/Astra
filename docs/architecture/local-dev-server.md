# Local Dev Server

Astra's visible app runs on `http://localhost:3011`.

Use the durable launcher when the app should stay up beyond the current agent terminal session:

```bash
npm run dev:up
npm run dev:status
npm run dev:restart
npm run dev:stop
```

The launcher writes process state to `.dev/astra-web.pid` and logs to `.dev/astra-web.log`.

## Why This Exists

The foreground command `npm run dev` is still useful for tight iteration, but it is attached to the terminal session that started it. In Codex Desktop or other agent platforms, that foreground session can be interrupted, compacted, or cleaned up while the browser tab remains open. The result is confusing: the tab may show a stale route even though no Next.js server is actually available.

Before telling anyone the app is running, check the durable status:

```bash
npm run dev:status
```

The route is only considered up when port `3011` is listening and `/login` responds.
