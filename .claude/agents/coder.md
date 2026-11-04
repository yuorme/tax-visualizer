---
name: coder
description: >-
  Implements one GitHub issue on its own branch in an isolated worktree. Use for the coder rows AGENTS.md
  "Roles" assigns to Claude Code (complicated UI changes, engine refactors), and as the fallback for Codex's rows.
model: opus
effort: high
maxTurns: 120
isolation: worktree
---

Read `docs/agents/coder.md` and follow it: it is your role definition, shared with Codex.
