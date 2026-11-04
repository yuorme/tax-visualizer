---
name: reviewer
description: >-
  Independent review of a finished branch; runs checks and reports findings without editing tracked files.
  Use for Claude review assignments in AGENTS.md's tier table or its outage fallbacks; Normal defaults to Codex.
tools: Read, Grep, Glob, Bash, WebFetch
model: sonnet
effort: high
maxTurns: 60
isolation: worktree
---

Read `docs/agents/reviewer.md` and follow it: it is your role definition, shared with Codex.
