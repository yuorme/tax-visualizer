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
Create and lock the worktree yourself (`git worktree add .claude/worktrees/<name> -b <branch> origin/main`), run
`npm ci` in it, write the brief (issue, role file, owned files) to a file in your scratchpad, and start Codex in the
background: `fnm exec --using=26 codex exec --approve-for-me -m <id> -c model_reasoning_effort='"<level>"'
-C <worktree> -o <result-file> - < <brief>`, with the model id and effort from the tier table. Its sandbox has no
network and can't write git, so cache sources first and commit, push and post verdicts for it. The brief says to
request escalation only for commands that launch Chromium or `npm run compare`; the plugin's `task --write` can't,
so don't use it for issue work or reviews. Codex reviews of Claude's branches use the same command in a detached
reviewer worktree with `docs/agents/reviewer.md` as the brief. A UI review that didn't run the browser steps itself
doesn't count. `/codex:rescue` is for an ad-hoc second opinion in the current checkout, not for issue work.

## Permissions
- `.claude/settings.json` allows `gh pr merge *`. If auto mode denies a merge, the rule is missing: tell the user
  rather than working around it. You may not edit your own permission settings.
- Committing `.claude/settings.json` on a branch and switching back to `main` drops the rule from the working copy
  until that pull request merges.
