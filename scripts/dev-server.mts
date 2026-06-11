import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Command = "up" | "status" | "stop" | "restart";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const stateDir = join(root, ".dev");
const pidFile = join(stateDir, "astra-web.pid");
const logFile = join(stateDir, "astra-web.log");
const port = 3011;

function ensureStateDir() {
  mkdirSync(stateDir, { recursive: true });
}

function readPid() {
  if (!existsSync(pidFile)) {
    return null;
  }

  const value = Number(readFileSync(pidFile, "utf8").trim());
  return Number.isFinite(value) && value > 0 ? value : null;
}

function isRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function listeningPids() {
  try {
    const output = execFileSync("lsof", ["-ti", `TCP:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
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

async function waitForPortToClear() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (listeningPids().length === 0) {
      return true;
    }

    await sleep(250);
  }

  return false;
}

async function waitForHealthy() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const status = await healthcheck();
    if (status.startsWith("200") || status.startsWith("30")) {
      return true;
    }

    await sleep(250);
  }

  return false;
}

async function healthcheck() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/login`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    return `${response.status} ${response.statusText}`;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return "timed out";
    }

    return error instanceof Error ? error.message : "unreachable";
  } finally {
    clearTimeout(timeout);
  }
}

async function printStatus() {
  const pid = readPid();
  const pidState = pid ? (isRunning(pid) ? `pid ${pid} running` : `pid ${pid} stale`) : "no pid file";
  const listeners = listeningPids();
  const listenerState = listeners.length > 0 ? `port ${port} listening by ${listeners.join(", ")}` : `port ${port} not listening`;
  const routeState = await healthcheck();

  console.log(`Astra dev server: ${pidState}; ${listenerState}; /login ${routeState}`);
}

async function start() {
  ensureStateDir();

  const pid = readPid();
  const listeners = listeningPids();
  if (pid && isRunning(pid)) {
    console.log(`Astra dev server already appears to be running on port ${port}.`);
    return;
  }

  if (listeners.length === 1) {
    writeFileSync(pidFile, `${listeners[0]}\n`);
    console.log(`Adopted existing Astra dev server pid ${listeners[0]} on port ${port}.`);
    return;
  }

  if (listeners.length > 1) {
    console.log(`Port ${port} already has multiple listeners: ${listeners.join(", ")}.`);
    return;
  }

  const out = openSync(logFile, "a");
  const child = spawn("npm", ["--workspace", "apps/astra-web", "run", "dev"], {
    cwd: root,
    detached: true,
    stdio: ["ignore", out, out],
    env: { ...process.env },
  });

  child.unref();
  writeFileSync(pidFile, `${child.pid}\n`);
  console.log(`Started Astra dev server on port ${port} with pid ${child.pid}.`);
  console.log(`Logs: ${logFile}`);
  await waitForHealthy();
}

async function stop() {
  const pid = readPid();
  const listeners = listeningPids();
  const targets = new Set<number>();

  if (pid && isRunning(pid)) {
    targets.add(pid);
  }

  for (const listener of listeners) {
    if (isRunning(listener)) {
      targets.add(listener);
    }
  }

  if (targets.size === 0) {
    console.log("No running Astra dev server pid found.");
  } else {
    for (const target of targets) {
      process.kill(target, "SIGTERM");
      console.log(`Stopped Astra dev server pid ${target}.`);
    }

    if (!(await waitForPortToClear())) {
      for (const target of targets) {
        if (isRunning(target)) {
          process.kill(target, "SIGKILL");
          console.log(`Force-stopped Astra dev server pid ${target}.`);
        }
      }
      await waitForPortToClear();
    }
  }

  if (existsSync(pidFile)) {
    rmSync(pidFile);
  }
}

const command = (process.argv[2] ?? "status") as Command;

if (!["up", "status", "stop", "restart"].includes(command)) {
  console.error("Usage: npm run dev:server -- <up|status|stop|restart>");
  process.exit(1);
}

if (command === "up") {
  await start();
  await printStatus();
} else if (command === "status") {
  await printStatus();
} else if (command === "stop") {
  await stop();
  await printStatus();
} else if (command === "restart") {
  await stop();
  await start();
  await printStatus();
}
