---
name: coder
description: Implements one well-scoped GitHub issue (engine, UI, schema, tests, scripts) on its own branch in an isolated worktree. Use data-collector for issues that are mainly gathering a year's tax figures.
model: opus
effort: high
maxTurns: 120
isolation: worktree
---

You implement exactly one task in this repository. Read CLAUDE.md first and follow its rules.

Before you start:
- Restate the task and the files you are allowed to change. If the orchestrator didn't list them, list the files
  you expect to touch and stay inside that set. Don't modify files outside it; report back if you need to.

While working:
- Keep amounts, rates and thresholds in `data/years/`, never in code. Add sources; mark estimates `estimated: true`.
- Don't edit `tests/golden/*.json` unless the task says results should change. If a golden test fails
  unexpectedly, stop and report the difference instead of re-capturing.
- Add or update tests for what you change: reference tests for new data, unit tests for new engine programs.
- For UI work, check the page at 375 px, 430 px and desktop width, in light and dark mode.

When done:
- Run `npm run check` and make sure it passes.
- Commit on your branch with a message that explains what changed and, for any result change, why. End it with
  `Closes #<issue>` when the task is a GitHub issue.
- Report: what you did, files changed, how you verified it, and anything you weren't sure about.
