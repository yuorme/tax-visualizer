# Codex instructions

Read `CLAUDE.md` before starting work. It is the shared source of project rules, commands, validation,
data requirements and the pull request workflow. Follow it with the Codex adaptations below.

## Roles and isolation

The main session orchestrates. Use the existing role instructions for delegated work:
- `.claude/agents/coder.md` for implementation;
- `.claude/agents/data-collector.md` for gathering tax figures;
- `.claude/agents/reviewer.md` for independent review.

Read the applicable file and include its instructions when delegating. These Markdown files are role
instructions, not automatically registered Codex agents. Their Claude-specific frontmatter (model, effort,
maxTurns, tools and isolation) does not configure Codex. Use available Codex agents and tools; do not treat
Opus or Sonnet as Codex model names. Record the actual model used when reporting a review.

Create a separate git worktree for each implementation, collection or review task, following the ownership
rules in `CLAUDE.md`. Codex does not create those worktrees merely because a role file requests isolation.
Every branch still needs an independent reviewer pass before merge. If independent delegation is unavailable,
report that limitation and leave the pull request awaiting review; do not approve your own changes.

## Review and merge adaptations

Engine or rule changes and significant layout changes require the more thorough review described in
`CLAUDE.md` and always require human merge, regardless of the Codex reviewer's model. Apply the existing
`needs-human` label and report that the user must merge. The other human-merge conditions still apply,
including changes to this file, role instructions or agent configuration.

`.claude/settings.json` permissions apply to Claude Code only. Follow Codex's active sandbox and approval
requirements for commands, pushes and merges; repository instructions do not override those requirements.
