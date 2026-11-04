@AGENTS.md

# Claude Code notes
Shared rules are in `AGENTS.md` above. This file holds only what is specific to Claude Code.

## Your part
Fill the roles the Roles table gives Claude Code; as orchestrator, dispatch the rest to the agent it names, even
when the work looks quick enough to do yourself. Use the fallback column only when that agent is unavailable, and
say so in the dispatch.

## Claude subagents
`.claude/agents/` registers `coder`, `data-collector` and `reviewer`, each in its own worktree; their bodies point
at `docs/agents/`. Use `coder` for Claude's coder rows and as the fallback for Codex's; `data-collector` is the
data fallback. Pass `model` and `effort` on every Agent call, taken from the tier table in `AGENTS.md`; the
frontmatter values are only defaults.

## Dispatching Codex
As orchestrator, follow `docs/agents/orchestrator.md`. Create and lock the worktree yourself
(`git worktree add .claude/worktrees/<name> -b <branch> origin/main`), write the brief to `<scratchpad>/<name>.md`,
and start Codex with a Bash call that uses `run_in_background`, so you're notified on exit and never poll:
`fnm exec --using=26 codex exec --approve-for-me -m <id> -c model_reasoning_effort='"<level>"'
-c sandbox_workspace_write.network_access=true -C <worktree> -o <scratchpad>/<name>.out - < <scratchpad>/<name>.md
> <scratchpad>/<name>.log 2>&1`, resolving Sol/Astra via AGENTS.md's mapping and taking effort from its table.
With network on, Codex runs
`npm ci`, `gh`, `git push` and `fetch-source` itself, and gets `git commit` and browser commands through escalation
(tested November 2026). So its brief says to do its own git, pull request and verdict steps; don't do them for it.
Read only `<name>.out`; `grep -m1 'session id' <name>.log` and `grep -A1 'tokens used' <name>.log` give the rest.
Send review fixes to the same session, from inside the worktree, so it keeps its context: `codex exec resume <id>`
with the same `-c` and `-o` flags plus `-c approval_policy='"on-request"' -c approvals_reviewer='"auto_review"'`
(`resume` takes neither `--approve-for-me` nor `-C`). Codex reviews start a fresh session with no shared coder
context in a detached reviewer worktree, using the same launch command and `docs/agents/reviewer.md`. A UI review that
didn't run the browser steps itself doesn't count. The plugin's `task` command runs with approvals off, so don't use
it for issue work or reviews; `/codex:rescue` is for an ad-hoc second opinion in the current checkout.

## Permissions
- `.claude/settings.json` allows `gh pr merge *`. If auto mode denies a merge, the rule is missing: tell the user
  rather than working around it. You may not edit your own permission settings.
- Committing `.claude/settings.json` on a branch and switching back to `main` drops the rule from the working copy
  until that pull request merges.
