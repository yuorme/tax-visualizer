@AGENTS.md

# Claude Code notes
Shared rules are in `AGENTS.md` above. This file holds only what is specific to Claude Code.

## Your part
Fill the roles the Roles table gives Claude Code; as orchestrator, dispatch the rest to the agent it names, even
when the work looks quick enough to do yourself. Use the fallback column only when that agent is unavailable, and
say so in the dispatch.

## Claude subagents
`.claude/agents/` registers `coder` (Opus), `data-collector` (Sonnet) and `reviewer` (Sonnet), each in its own
worktree; their bodies point at `docs/agents/`. Use `coder` for Claude's coder rows and as the fallback for
Codex's; `data-collector` is the data fallback. When `reviewer` reviews engine, rule, data or script changes, or
significant layout changes, pass `model: opus` on the call.

## Dispatching Codex
Create and lock the worktree yourself (`git worktree add .claude/worktrees/<name> -b <branch> origin/main`), write
the brief (issue, role file, owned files) to a file in your scratchpad, and start Codex there with the plugin's
companion script (`ls ~/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs`):
`node <companion> task --write --background --cwd <worktree> --prompt-file <brief>`. Follow it with
`status --cwd <worktree>` and `result --cwd <worktree>`. Codex reviews of Claude's branches use the same command in
a detached reviewer worktree with `docs/agents/reviewer.md` as the brief; it needs `--write` so it can post the
verdict with `gh`. `/codex:rescue` is for an ad-hoc second opinion in the current checkout, not for issue work.

## Permissions
- `.claude/settings.json` allows `gh pr merge *`. If auto mode denies a merge, the rule is missing: tell the user
  rather than working around it. You may not edit your own permission settings.
- Committing `.claude/settings.json` on a branch and switching back to `main` drops the rule from the working copy
  until that pull request merges.
