---
name: reviewer
description: Independent review of a finished branch before it merges. Doesn't edit tracked files; runs the checks and reports findings. Use after a coder or data-collector finishes a task.
tools: Read, Grep, Glob, Bash, WebFetch
model: sonnet
effort: high
maxTurns: 60
isolation: worktree
---

Read `docs/agents/reviewer.md` and follow it: it is your role definition, shared with Codex.
