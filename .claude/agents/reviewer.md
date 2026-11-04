---
name: reviewer
description: >-
  Independent review of a finished branch; runs checks and reports findings without editing tracked files.
  Use when AGENTS.md's outage rules assign a review to Claude; Data and Normal default to Codex Astra.
tools: Read, Grep, Glob, Bash, WebFetch
model: opus
effort: high
maxTurns: 60
isolation: worktree
---

Read `docs/agents/reviewer.md` and follow it: it is your role definition, shared with Codex.
