---
name: reviewer
description: >-
  Independent review of a finished branch; runs checks and reports findings without editing tracked files.
  Use for Claude's reviews in AGENTS.md's tier table; Codex reviews Claude's own branches.
tools: Read, Grep, Glob, Bash, WebFetch
model: opus
effort: high
maxTurns: 60
isolation: worktree
---

Read `docs/agents/reviewer.md` and follow it: it is your role definition, shared with Codex.
