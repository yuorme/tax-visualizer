---
name: reviewer
description: >-
  Independent review of a finished branch; runs checks and reports findings without editing tracked files.
  Use when the orchestrator gives a review to Claude; the tier table sets the default.
tools: Read, Grep, Glob, Bash, WebFetch
model: opus
effort: high
maxTurns: 60
isolation: worktree
---

Read `docs/agents/reviewer.md` and follow it: it is your role definition, shared with Codex.
