#!/usr/bin/env python3
"""Akashic attention gate for Codex hooks."""

from __future__ import annotations

import os
import json
import re
import sys
from pathlib import Path
from typing import Any


BLOCKING_STATUS = "new"
RESOLVED_STATUSES = {"acknowledged", "acted", "deferred", "superseded", "closed"}
REMEDIATION_COMMAND = re.compile(r"\bak\s+inbox\s+(ack|defer|close)\b")
EVENT_PRE_TOOL_USE = "PreToolUse"


def find_repo_root(start: Path) -> Path | None:
    for candidate in (start, *start.parents):
        if (candidate / "akashic").is_dir():
            return candidate
    return None


def frontmatter_status(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return BLOCKING_STATUS

    end = text.find("\n---", 3)
    if end == -1:
        return BLOCKING_STATUS

    for line in text[3:end].splitlines():
        if line.strip().startswith("status:"):
            return line.split(":", 1)[1].strip().strip("\"'")
    return BLOCKING_STATUS


def scan(root: Path) -> list[tuple[Path, str]]:
    targets = [
        root / "akashic" / "agent-inbox",
        root / "akashic" / "warnings",
    ]
    blockers: list[tuple[Path, str]] = []
    for directory in targets:
        if not directory.is_dir():
            continue
        for path in sorted(directory.glob("*.md")):
            status = frontmatter_status(path)
            if status == BLOCKING_STATUS:
                blockers.append((path, status))
    return blockers


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
    if REMEDIATION_COMMAND.search(command_text(payload)):
        return True

    allowed_dirs = [
        root / "akashic" / "agent-inbox",
        root / "akashic" / "warnings",
    ]
    paths = requested_paths(payload)
    if not paths:
        return False
    return all(any(is_inside(path if path.is_absolute() else root / path, directory) for directory in allowed_dirs) for path in paths)


def print_blockers(root: Path, blockers: list[tuple[Path, str]], *, blocking: bool) -> None:
    action = "blocked this action" if blocking else "found active messages"
    print(f"Akashic attention gate {action}.", file=sys.stderr)
    print("Resolve new Akashic inbox/warning items before product work.", file=sys.stderr)
    print("Allowed remediation while blocked:", file=sys.stderr)
    print("  - edit files inside akashic/agent-inbox/ or akashic/warnings/", file=sys.stderr)
    print("  - run ak inbox ack, ak inbox defer, or ak inbox close", file=sys.stderr)
    print("Set each file status to one of:", file=sys.stderr)
    print(f"  {', '.join(sorted(RESOLVED_STATUSES))}", file=sys.stderr)
    print("Blocking files:", file=sys.stderr)
    for path, status in blockers:
        print(f"  - {path.relative_to(root)} (status: {status})", file=sys.stderr)


def main() -> int:
    root = find_repo_root(Path(os.environ.get("AKASHIC_ROOT", os.getcwd())).resolve())
    if root is None:
        return 0

    blockers = scan(root)
    if not blockers:
        return 0

    payload = read_hook_payload()
    event = hook_event(payload)
    if event and event != EVENT_PRE_TOOL_USE:
        print_blockers(root, blockers, blocking=False)
        return 0

    if is_allowed_remediation(payload, root):
        return 0

    print_blockers(root, blockers, blocking=True)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
