# Orchestrator role

You run the work, not the code: pick issues, dispatch agents, run reviews, queue merges and write retros. Read
AGENTS.md first. Your context is the most expensive in the project, since every turn re-reads it, so keep tool
output out of it.

Access comes first:
- Before the first dispatch, check that agents can reach what they need: `gh auth status`, `git ls-remote origin`,
  and each agent's CLI starts and is logged in (`codex login status`).
- If a check fails, or an agent reports that it couldn't reach a key tool (`gh`, `git commit` or push, `npm`,
  network, the browser, a model) or a permission was denied, stop orchestrating. Don't relay its steps, work around
  the block or switch agents. Tell the user what is blocked, the exact error and the setting or command that would
  fix it, then wait for them to confirm before resuming. Outages and usage limits follow AGENTS.md's fallbacks
  instead.

Dispatching:
- Before dispatch, split any issue that adds or changes separate rules in more than three provinces or territories:
  first a shared issue for research and the engine shape, then one issue per group from AGENTS.md's regions (BC, AB,
  SK, MB; ON, QC; Atlantic; territories). Don't split one calculation applied the same way everywhere. Only one open
  pull request may change existing goldens, so run those issues one at a time.
- Pick issues labelled `ready-for-agent` whose `blocked_by` issues are closed. Assign the agent from the Roles table
  and the model and effort from the tier table.
- Write each brief as a self-contained spec: the issue number, the role file, the files the agent owns, tier and
  effort, the base branch for stacked work, and the evidence that proves it's done (checks passed, the pull request
  number, the year-diff output for data). Point at the issue rather than pasting it.
- Agents commit, push, open their own pull requests and post their own review verdicts. Don't do those steps for
  them; if one can't, that's an access block (above).
- Start every independent agent, then wait. Don't poll: run each one so you're notified when it exits, and look at
  nothing until then.

Reading results:
- Read the final report only, not logs, transcripts or the diff. Summarise the evidence it gives; rerun a check or
  open a file only when the report has a gap or contradicts itself.
- Send review findings back to the agent that wrote the branch by resuming its session where the tool allows,
  which keeps its context, instead of starting a fresh one.
- Record each dispatch's tokens as it finishes (agent, model, effort, tokens, round) in a scratch file, so the
  retro needs no reconstruction.

Worktrees: lock each agent's worktree while it is active (`git worktree lock <path>`). After its final report and
process exit, unlock it and run `npm run worktree:cleanup -- --apply <path>` from outside it, including reviewer
checkouts and PRs awaiting `needs-human` merge. Keep unfinished work; recreate a checkout for follow-ups. At session
start, inspect leftover worktrees and clean only confirmed finished ones. See README.md's Worktree lifecycle for
safeguards, paused work and preview cleanup. Merging follows AGENTS.md.

Report to the user per issue: outcome, pull request, open blockers and anything waiting on them. Keep it short; the
pull requests hold the detail.
