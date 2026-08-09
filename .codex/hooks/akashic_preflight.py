#!/usr/bin/env python3
"""Akashic Mail attention gate for Codex hooks."""

from __future__ import annotations

import json
import hashlib
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


EVENT_PRE_TOOL_USE = "PreToolUse"
REMEDIATION_COMMAND = re.compile(r"^\s*ak\s+mail\s+(claim|close|release|reopen|read|list|status|validate|migrate-agent-inbox)\b")
CLOSEOUT_COMMAND = re.compile(r"^\s*ak\s+closeout\s+(list|read|lesson|playbook|none)\b")
LOCAL_CLOSEOUT_COMMAND = re.compile(r"^\s*node\s+(?:\./)?dist/cli\.js\s+closeout\s+(list|read|lesson|playbook|none)\b")
LEARNING_COMMAND = re.compile(r"^\s*ak\s+(learn|capture)\s+(skill|warning|adr|decision|mission)\b")
REVIEW_COMMAND = re.compile(r"^\s*(git\s+(status|diff|show)|ak\s+(doctor|dirty|validate|governance\s+check|repomap\s+check)|npm\s+(test|run\s+(test|check|lint|typecheck)))\b")
UNSAFE_SHELL_SYNTAX = re.compile(r"&&|\|\||[;|<>]|\$\(|[\r\n]")
READ_ONLY_TOOLS = {"Read", "Glob", "Grep", "LS"}
SOURCE_ROOTS = {"src", "tests", "test", "app", "apps", "packages", "scripts", ".codex"}
SOURCE_FILES = {"package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "tsconfig.json", "AGENTS.md"}
IGNORED_PREFIXES = (
    "akashic/closeouts/",
    "akashic/mail/",
    "akashic/runtime/",
    "akashic/logs/",
    "akashic/repomaps/current.",
    "akashic/repomaps/meta.json",
)
LEARNING_DIRS = ("skills", "warnings", "decisions", "playbooks", "frameworks", "missions", "closeouts")


def find_repo_root(start: Path) -> Path | None:
    for candidate in (start, *start.parents):
        if (candidate / "akashic").is_dir():
            return candidate
    return None


def parse_frontmatter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}

    end = text.find("\n---", 3)
    if end == -1:
        return {}

    values: dict[str, str] = {}
    for line in text[3:end].splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip().strip("\"'")
    return values


def is_blocking_mail(path: Path) -> bool:
    fm = parse_frontmatter(path)
    status = fm.get("status")
    purpose = fm.get("purpose")
    if status not in {"new", "working"}:
        return False
    if purpose not in {"do", "ask"}:
        return False
    if fm.get("approval_required") == "true":
        return purpose == "ask"
    return True


def scan(root: Path) -> list[Path]:
    blockers: list[Path] = []
    for box in ("new", "working"):
        directory = root / "akashic" / "mail" / box
        if not directory.is_dir():
            continue
        for path in sorted(directory.glob("*.md")):
            if is_blocking_mail(path):
                blockers.append(path)
    return blockers


def scan_closeouts(root: Path) -> list[Path]:
    directory = root / "akashic" / "closeouts"
    if not directory.is_dir():
        return []
    return [path for path in sorted(directory.glob("AKC-*.md")) if parse_frontmatter(path).get("status") == "pending"]


def read_hook_payload() -> dict[str, Any]:
    if sys.stdin.isatty():
        return {}
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def hook_event(payload: dict[str, Any]) -> str:
    return (
        os.environ.get("AKASHIC_HOOK_EVENT")
        or str(payload.get("hook_event_name") or payload.get("event") or "")
    )


def tool_input(payload: dict[str, Any]) -> dict[str, Any]:
    value = payload.get("tool_input") or payload.get("input") or payload.get("parameters") or {}
    return value if isinstance(value, dict) else {}


def command_text(payload: dict[str, Any]) -> str:
    return (
        os.environ.get("AKASHIC_PREFLIGHT_COMMAND")
        or str(tool_input(payload).get("command") or tool_input(payload).get("cmd") or "")
    )


def tool_name(payload: dict[str, Any]) -> str:
    return os.environ.get("AKASHIC_PREFLIGHT_TOOL_NAME") or str(payload.get("tool_name") or payload.get("tool") or "")


def requested_paths(payload: dict[str, Any]) -> list[Path]:
    env_path = os.environ.get("AKASHIC_PREFLIGHT_PATH")
    raw_values: list[Any] = [env_path] if env_path else []
    input_data = tool_input(payload)
    for key in ("file_path", "path"):
        if input_data.get(key):
            raw_values.append(input_data[key])
    if isinstance(input_data.get("edits"), list):
        for edit in input_data["edits"]:
            if isinstance(edit, dict) and edit.get("file_path"):
                raw_values.append(edit["file_path"])
    if tool_name(payload).lower().endswith("apply_patch"):
        patch = command_text(payload)
        raw_values.extend(re.findall(r"^\*\*\* (?:Add|Update|Delete) File: (.+)$", patch, re.MULTILINE))

    paths: list[Path] = []
    for value in raw_values:
        if isinstance(value, str) and value.strip():
            paths.append(Path(value).expanduser())
    return paths


def is_inside(path: Path, directory: Path) -> bool:
    try:
        path.resolve().relative_to(directory.resolve())
        return True
    except ValueError:
        return False


def is_allowed_remediation(payload: dict[str, Any], root: Path) -> bool:
    command = command_text(payload)
    if command_is_allowed(command, REMEDIATION_COMMAND):
        return True

    paths = requested_paths(payload)
    if not paths:
        return False
    mail_root = root / "akashic" / "mail"
    return all(is_inside(path if path.is_absolute() else root / path, mail_root) for path in paths)


def is_allowed_closeout_remediation(payload: dict[str, Any], root: Path) -> bool:
    if is_allowed_remediation(payload, root):
        return True
    command = command_text(payload)
    if tool_name(payload) in READ_ONLY_TOOLS:
        return True
    if any(command_is_allowed(command, pattern) for pattern in (CLOSEOUT_COMMAND, LOCAL_CLOSEOUT_COMMAND, LEARNING_COMMAND, REVIEW_COMMAND)):
        return True
    paths = requested_paths(payload)
    if not paths:
        return False
    allowed = [root / "akashic" / directory for directory in LEARNING_DIRS]
    return all(
        any(is_inside(path if path.is_absolute() else root / path, directory) for directory in allowed)
        for path in paths
    )


def command_is_allowed(command: str, pattern: re.Pattern[str]) -> bool:
    return bool(command.strip()) and chr(96) not in command and UNSAFE_SHELL_SYNTAX.search(command) is None and pattern.search(command) is not None


def git(root: Path, *args: str) -> bytes | None:
    result = subprocess.run(
        ["git", *args],
        cwd=root,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.stdout if result.returncode == 0 else None


def state_path(root: Path) -> Path | None:
    raw = git(root, "rev-parse", "--git-path", "akashic-closeout-session.json")
    if raw is None:
        return None
    path = Path(raw.decode("utf-8").strip())
    return path if path.is_absolute() else root / path


def ignored(path: str) -> bool:
    return path == ".DS_Store" or any(path.startswith(prefix) for prefix in IGNORED_PREFIXES)


def worktree_snapshot(root: Path) -> dict[str, Any] | None:
    head_raw = git(root, "rev-parse", "HEAD")
    tracked_raw = git(root, "diff", "--name-only", "-z", "HEAD")
    untracked_raw = git(root, "ls-files", "--others", "--exclude-standard", "-z")
    if head_raw is None or tracked_raw is None or untracked_raw is None:
        return None
    files: dict[str, str] = {}
    names = set(filter(None, tracked_raw.decode("utf-8").split("\0")))
    names.update(filter(None, untracked_raw.decode("utf-8").split("\0")))
    for name in sorted(names):
        if ignored(name):
            continue
        diff = git(root, "diff", "--binary", "HEAD", "--", name) or b""
        file = root / name
        content = file.read_bytes() if file.is_file() else b""
        files[name] = hashlib.sha256(diff + b"\0" + content).hexdigest()
    return {"head": head_raw.decode("utf-8").strip(), "files": files}


def start_session(root: Path) -> None:
    path = state_path(root)
    if path is None or path.exists():
        return
    snapshot = worktree_snapshot(root)
    if snapshot is None:
        return
    snapshot["started_at"] = datetime.now(timezone.utc).isoformat()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")


def changed_since(root: Path, baseline: dict[str, Any], current: dict[str, Any]) -> list[str]:
    before = baseline.get("files") if isinstance(baseline.get("files"), dict) else {}
    after = current.get("files") if isinstance(current.get("files"), dict) else {}
    changed = {name for name, digest in after.items() if before.get(name) != digest and not ignored(name)}
    old_head = str(baseline.get("head") or "")
    new_head = str(current.get("head") or "")
    if old_head and new_head and old_head != new_head:
        committed = git(root, "diff", "--name-only", "-z", old_head, new_head)
        if committed is not None:
            changed.update(name for name in committed.decode("utf-8").split("\0") if name and not ignored(name))
    return sorted(changed)


def is_substantial(paths: list[str]) -> bool:
    if len(paths) >= 2:
        return True
    if not paths:
        return False
    path = paths[0]
    return path.split("/", 1)[0] in SOURCE_ROOTS or path in SOURCE_FILES


def create_receipt(root: Path, baseline: dict[str, Any], current: dict[str, Any], paths: list[str]) -> Path:
    now = datetime.now(timezone.utc)
    receipt_id = f"AKC-{now.strftime('%Y%m%d-%H%M%S')}"
    directory = root / "akashic" / "closeouts"
    directory.mkdir(parents=True, exist_ok=True)
    file = directory / f"{receipt_id}.md"
    suffix = 2
    while file.exists():
        file = directory / f"{receipt_id}-{suffix}.md"
        suffix += 1
    receipt_id = file.stem
    date = now.date().isoformat()
    project = root.name.lower().replace(" ", "-")
    changed_lines = "\n".join(f"- `{path}`" for path in paths)
    text = f'''---
title: "Closeout {receipt_id}"
type: "closeout"
description: "Automatic receipt requiring an explicit learning decision after substantial changed work."
status: "pending"
project: "{project}"
created: "{date}"
updated: "{date}"
started_at: "{baseline.get('started_at', '')}"
stopped_at: "{now.isoformat()}"
baseline_head: "{baseline.get('head', '')}"
current_head: "{current.get('head', '')}"
changed_file_count: "{len(paths)}"
learning_decision: "pending"
learning_reference: "none"
tags: ["closeout", "learning-decision", "automatic-receipt"]
---

# Closeout {receipt_id}

## Changed Files

{changed_lines}

## Learning Decision

Pending. Choose exactly one: capture a reusable lesson, update an existing playbook, or record no new reusable lesson with a reason.
'''
    file.write_text(text, encoding="utf-8")
    return file


def stop_session(root: Path) -> Path | None:
    path = state_path(root)
    if path is None or not path.exists():
        return None
    try:
        baseline = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        path.unlink(missing_ok=True)
        return None
    current = worktree_snapshot(root)
    path.unlink(missing_ok=True)
    if current is None:
        return None
    paths = changed_since(root, baseline, current)
    return create_receipt(root, baseline, current, paths) if is_substantial(paths) else None


def print_blockers(root: Path, blockers: list[Path], *, blocking: bool) -> None:
    action = "blocked this action" if blocking else "found actionable mail"
    print(f"Akashic Mail attention gate {action}.", file=sys.stderr)
    print("Resolve actionable Akashic Mail before product work.", file=sys.stderr)
    print("Allowed remediation while blocked:", file=sys.stderr)
    print("  - edit files inside akashic/mail/", file=sys.stderr)
    print("  - run ak mail claim, ak mail close, ak mail release, or ak mail reopen", file=sys.stderr)
    print("Blocking mail:", file=sys.stderr)
    for path in blockers:
        fm = parse_frontmatter(path)
        print(f"  - {path.relative_to(root)} (purpose: {fm.get('purpose', '?')}, status: {fm.get('status', '?')})", file=sys.stderr)


def print_closeout_blockers(root: Path, blockers: list[Path], *, blocking: bool) -> None:
    action = "blocked this action" if blocking else "requires a learning decision"
    print(f"Akashic closeout gate {action}.", file=sys.stderr)
    print("Choose one: ak closeout lesson, ak closeout playbook, or ak closeout none --reason <text>.", file=sys.stderr)
    print("ak learn/capture and edits to learning artifacts remain available.", file=sys.stderr)
    print("Pending closeouts:", file=sys.stderr)
    for path in blockers:
        print(f"  - {path.relative_to(root)}", file=sys.stderr)


def main() -> int:
    root = find_repo_root(Path(os.environ.get("AKASHIC_ROOT", os.getcwd())).resolve())
    if root is None:
        return 0

    payload = read_hook_payload()
    event = hook_event(payload)
    if event == "SessionStart":
        start_session(root)
    elif event == "Stop":
        receipt = stop_session(root)
        if receipt is not None:
            print(f"Akashic created pending closeout receipt: {receipt.relative_to(root)}", file=sys.stderr)

    blockers = scan(root)
    closeout_blockers = scan_closeouts(root)
    if event and event != EVENT_PRE_TOOL_USE:
        if blockers:
            print_blockers(root, blockers, blocking=False)
        if closeout_blockers:
            print_closeout_blockers(root, closeout_blockers, blocking=False)
        return 0

    if blockers:
        if is_allowed_remediation(payload, root):
            return 0
        print_blockers(root, blockers, blocking=True)
        return 2

    if closeout_blockers:
        if is_allowed_closeout_remediation(payload, root):
            return 0
        print_closeout_blockers(root, closeout_blockers, blocking=True)
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
