#!/usr/bin/env python3
"""Compact completed project test results for Codex and Claude Code."""

import json
import os
from pathlib import Path
import re
import shlex
import sys
import tempfile


ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
ROOT = Path(__file__).resolve().parent.parent
DIAGNOSTIC = re.compile(
    r"\b(?:warn(?:ing)?s?|\w*Warning|error|fail(?:ed|ures?)?|exception|fatal|panic)\b"
    r"|^\s*(?:not ok\b|[✖×]|FAIL\b|E\s{2,}|_{3,})", re.I
)
PASS = re.compile(
    r"^\s*(?:[✔✓√]\s+.*|PASS\s+.*|ok\s+\d+\b.*|"
    r"test\s+.+\s+\.\.\.\s+ok|.+\s+PASSED\s*(?:\[.*\])?|"
    r"\.{3,}\s*(?:\[\s*\d+%\])?)$"
)
NOISE = re.compile(
    r"^\s*(?:TAP version \d+|\d+\.\.\d+|# Subtest:.*|"
    r"[ℹ#]\s*(?:tests|suites|pass|fail|cancelled|skipped|todo|duration_ms)\s+[\d.]+|"
    r"[ℹ#]\s*duration_ms\s+[\d.]+|"
    r"(?:Test Files|Test Suites|Tests|Snapshots|Time|Duration|Start at)\s*:?.*|"
    r"Ran all test suites.*|=+\s*\d+ passed.*=+)\s*$"
)


def test_command(command, cwd):
    """Recognize this project's test commands without parsing arbitrary shell."""
    # Leave pipelines, redirection, substitutions, and shell programs untouched.
    if any(c in command for c in "\n\r`$<>|(){}"):
        return False
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars=";&")
        lexer.whitespace_split = True
        lexer.commenters = "#"
        words = list(lexer)
    except ValueError:
        return False
    groups = [[]]
    for word in words:
        if word in ("&&", ";"):
            groups.append([])
        elif word == "&":
            return False
        else:
            groups[-1].append(word)
    found = False
    for args in groups:
        while args and re.match(r"^[A-Za-z_][A-Za-z_0-9]*=", args[0]):
            args = args[1:]
        if not args:
            return False
        exe = Path(args[0]).name
        rest = args[1:]
        if exe == "cd" and len(rest) == 1:
            cwd = (cwd / rest[0]).resolve()
            if not cwd.is_relative_to(ROOT):
                return False
            continue
        if exe == "fnm" and rest[:1] == ["exec"]:
            rest = rest[1:]
            if rest[:1] == ["--using"] and len(rest) >= 3:
                rest = rest[2:]
            elif rest and rest[0].startswith("--using="):
                rest = rest[1:]
            if rest[:1] == ["--"]:
                rest = rest[1:]
            if not rest:
                return False
            exe, rest = Path(rest[0]).name, rest[1:]
        is_test = (
            (exe == "node" and "--test" in rest)
            or (exe == "npm" and (
                rest[:1] in (["test"], ["t"])
                or (rest[:1] == ["run"] and len(rest) > 1 and rest[1] in ("test", "check"))
            ))
        )
        if exe == "npm" and any(
            value in ("--prefix", "--workspace", "--workspaces", "-w", "-C")
            or value.startswith(("--prefix=", "--workspace=", "--workspaces=", "-w", "-C"))
            for value in rest
        ):
            return False
        if not is_test or any(x in rest for x in ("--watch", "--watchAll", "watch", "--ui")):
            return False
        found = True
    return found


def extract(response, client):
    if isinstance(response, str):
        if client != "codex":
            return None
        try:
            decoded = json.loads(response)
        except ValueError:
            decoded = None
        if isinstance(decoded, dict):
            return extract(decoded, client)
        match = re.search(r"Process exited with code (-?\d+)\n.*?output:\n", response, re.S | re.I)
        if match:
            return response[match.end():], int(match[1])
        return None
    if not isinstance(response, dict):
        return None
    if any(response.get(key) for key in (
        "interrupted", "isImage", "backgroundTaskId", "background_task_id", "task_id", "taskId", "session_id"
    )):
        return None
    code = response.get("exit_code")
    if code is None and isinstance(response.get("metadata"), dict):
        code = response["metadata"].get("exit_code")
    if client == "claude":
        # Claude's successful Bash event has no exit code. Require its documented
        # completed-result shape; don't label background/unknown results success.
        if response.get("interrupted") is not False or response.get("isImage") is not False:
            return None
        if not isinstance(response.get("stdout"), str) or not isinstance(response.get("stderr"), str):
            return None
        if code is not None and type(code) is not int:
            return None
        return response["stdout"] + "\n" + response["stderr"], code
    elif type(code) is not int or response.get("session_id") is not None:
        return None
    if isinstance(response.get("output"), str):
        return response["output"], code
    if isinstance(response.get("stdout"), str) and isinstance(response.get("stderr", ""), str):
        return response["stdout"] + "\n" + response.get("stderr", ""), code
    return None


def compact(output):
    lines = ANSI.sub("", output).splitlines()
    kept = []
    diagnostic = False
    removed = 0
    index = 0
    while index < len(lines):
        line = lines[index]
        index += 1
        # Once diagnostics start, retain their entire context, diffs and stacks.
        # Don't mistake a zero-failure summary for a diagnostic.
        summary = NOISE.fullmatch(line)
        passing = PASS.fullmatch(line)
        test_title = re.fullmatch(r"\s*# Subtest:.*", line)
        if (
            DIAGNOSTIC.search(line) and not passing and not test_title
            and not (summary and re.search(r"\bfail\s+0\b", line))
        ):
            diagnostic = True
        if diagnostic:
            kept.append(line)
        elif passing or summary:
            removed += 1
            # Successful TAP tests can have a small metadata block. Drop only
            # recognized timing/type metadata, never arbitrary YAML content.
            if passing and index < len(lines) and lines[index].strip() == "---":
                end = index + 1
                while end < len(lines) and re.fullmatch(
                    r"\s*(?:duration_ms:\s*[\d.]+|type:\s*['\"]?(?:test|suite)['\"]?)\s*", lines[end]
                ):
                    end += 1
                if end < len(lines) and lines[end].strip() == "...":
                    removed += end - index + 1
                    index = end + 1
        else:
            kept.append(line)
    # Avoid changing unknown output or saving tokens only to add more metadata.
    return "\n".join(kept).strip(), removed


def handle(event, client):
    if not isinstance(event, dict) or event.get("hook_event_name") != "PostToolUse":
        return None
    if event.get("tool_name") not in ("Bash", "exec_command", "shell", "shell_command"):
        return None
    inp = event.get("tool_input")
    if not isinstance(inp, dict):
        return None
    command = inp.get("command", inp.get("cmd"))
    cwd = inp.get("workdir") if inp.get("workdir") is not None else event.get("cwd")
    if not isinstance(cwd, str) or not Path(cwd).is_absolute():
        return None
    cwd = Path(cwd).resolve()
    if not cwd.is_relative_to(ROOT):
        return None
    if not isinstance(command, str) or not test_command(command, cwd):
        return None
    response = event.get("tool_response")
    result = extract(response, client)
    if result is None:
        return None
    output, code = result
    if re.search(r"output truncated|truncated output|tokens truncated|Script running|Process running", output, re.I):
        return None
    trimmed, removed = compact(output)
    if removed < 3 or len(output) - len(trimmed) < 300:
        return None
    # Hook feedback is subject to Codex's own output limit. Never truncate errors.
    if len(trimmed.encode("utf-8")) > 6000:
        return None
    fd, raw_path = tempfile.mkstemp(prefix="tax-test-", suffix=".log")
    with os.fdopen(fd, "w", encoding="utf-8") as raw:
        raw.write(output)
    status = f"Test command exit code: {code}." if code is not None else "Test tool completed; exit code not supplied."
    message = f"Full original output: {raw_path}\n{status} Removed {removed} test progress/summary lines.\n"
    message += trimmed or "No failure or warning output remained."
    if client == "claude":
        replacement = dict(response, stdout=message, stderr="")
        return {"hookSpecificOutput": {"hookEventName": "PostToolUse", "updatedToolOutput": replacement}}
    # Unlike decision:block, this does not reject code-mode tool promises.
    return {"continue": False, "stopReason": message}


def main():
    try:
        if len(sys.argv) != 2 or sys.argv[1] not in ("--codex", "--claude"):
            return
        result = handle(json.load(sys.stdin), sys.argv[1][2:])
        if result:
            print(json.dumps(result))
    except (ValueError, TypeError, OSError):
        # Fail open: a filter problem must never suppress the real test result.
        pass


if __name__ == "__main__":
    main()
