import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Command = "logs" | "restart" | "status" | "stop" | "up";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const stateDir = join(root, ".dev");
const logFile = join(stateDir, "composer-web.log");
const screenName = "astra-composer-web-3012";
const port = 3012;
const healthRoute = "/";

function ensureStateDir() {
  mkdirSync(stateDir, { recursive: true });
}

function toolPath(name: string) {
  try {
    return execFileSync("which", [name], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function requireScreen() {
  const screen = toolPath("screen");
  if (!screen) {
    console.error("Composer durable dev server requires `screen`; Akashic guidance says use pm2, screen, or tmux rather than nohup.");
    process.exit(1);
  }
}

function screenSessions() {
  try {
    return execFileSync("screen", ["-ls"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (error) {
    const output = (error as { stdout?: Buffer | string }).stdout;
    return Buffer.isBuffer(output) ? output.toString("utf8") : output ?? "";
  }
}

function isScreenRunning() {
  return screenSessions().includes(`.${screenName}`);
}

function listenerPids() {
  try {
    const output = execFileSync("lsof", ["-ti", `TCP:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });

    return output
      .split("\n")
      .map((line) => Number(line.trim()))
      .filter((pid) => Number.isFinite(pid) && pid > 0);
  } catch {
    return [];
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function healthcheck() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`http://127.0.0.1:${port}${healthRoute}`, {
      cache: "no-store",
      signal: controller.signal
    });
    await response.arrayBuffer();
    return `${response.status} ${response.statusText}`;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "timed out";
    return error instanceof Error ? error.message : "unreachable";
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForPortToClear() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (listenerPids().length === 0) return true;
    await sleep(250);
  }
  return false;
}

async function waitForHealthy() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const status = await healthcheck();
    if (status.startsWith("200") || status.startsWith("30")) return true;
    await sleep(500);
  }
  return false;
}

async function printStatus() {
  const screenState = isScreenRunning() ? `screen ${screenName} running` : `screen ${screenName} not running`;
  const listeners = listenerPids();
  const listenerState = listeners.length ? `port ${port} listening by ${listeners.join(", ")}` : `port ${port} not listening`;
  const routeState = await healthcheck();
  console.log(`Composer dev server: ${screenState}; ${listenerState}; ${healthRoute} ${routeState}`);
  console.log(`Logs: ${logFile}`);
}

async function start() {
  requireScreen();
  ensureStateDir();

  if (isScreenRunning() && listenerPids().length > 0) {
    console.log(`Composer dev server already appears to be running on port ${port}.`);
    await printStatus();
    return;
  }

  const listeners = listenerPids();
  if (listeners.length) {
    console.log(`Port ${port} has listener pid(s) outside the Composer screen session: ${listeners.join(", ")}. Restarting them.`);
    for (const pid of listeners) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }
    if (!(await waitForPortToClear())) {
      for (const pid of listeners) {
        try {
          process.kill(pid, "SIGKILL");
        } catch {}
      }
      await waitForPortToClear();
    }
  }

  if (isScreenRunning()) {
    spawnSync("screen", ["-S", screenName, "-X", "quit"], { stdio: "ignore" });
    await sleep(500);
  }

  const command = [
    `cd ${JSON.stringify(root)}`,
    `: > ${JSON.stringify(logFile)}`,
    `export COMPOSER_REQUIRE_AUTH=0`,
    'export ASTRA_INTERNAL_API_TOKEN="${ASTRA_INTERNAL_API_TOKEN:-astra-local-internal-token}"',
    `exec npm --workspace apps/composer-web run dev >> ${JSON.stringify(logFile)} 2>&1`
  ].join(" && ");

  const started = spawnSync("screen", ["-dmS", screenName, "zsh", "-lc", command], {
    cwd: root,
    stdio: "ignore"
  });

  if (started.status !== 0) {
    console.error(`Failed to start Composer dev server screen session ${screenName}.`);
    process.exit(started.status ?? 1);
  }

  console.log(`Started Composer dev server in screen session ${screenName} on port ${port}.`);
  await waitForHealthy();
  await printStatus();
}

async function stop() {
  const listeners = listenerPids();

  if (isScreenRunning()) {
    spawnSync("screen", ["-S", screenName, "-X", "quit"], { stdio: "ignore" });
    console.log(`Stopped Composer screen session ${screenName}.`);
  }

  if (!(await waitForPortToClear())) {
    for (const pid of listeners) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }
    if (!(await waitForPortToClear())) {
      for (const pid of listeners) {
        try {
          process.kill(pid, "SIGKILL");
        } catch {}
      }
      await waitForPortToClear();
    }
  }

  await printStatus();
}

function logs() {
  if (!existsSync(logFile)) {
    console.log(`No Composer log file found at ${logFile}.`);
    return;
  }

  const lines = readFileSync(logFile, "utf8").split("\n").slice(-120).join("\n");
  console.log(lines);
}

const command = (process.argv[2] ?? "status") as Command;

if (!["logs", "restart", "status", "stop", "up"].includes(command)) {
  console.error("Usage: npm run composer:server -- <up|status|restart|stop|logs>");
  process.exit(1);
}

if (command === "up") {
  await start();
} else if (command === "status") {
  await printStatus();
} else if (command === "stop") {
  await stop();
} else if (command === "restart") {
  await stop();
  await start();
} else {
  logs();
}
