# Codex instructions

Read and follow `CLAUDE.md` for all shared project rules and workflows. For delegated work, read the relevant
role file in `.claude/agents/` (`coder.md`, `data-collector.md` or `reviewer.md`) and pass its instructions along.

Codex adaptations:

- Claude role files are not automatically registered Codex agents. Their frontmatter does not configure Codex
  models, tools, turn limits or isolation. Use available Codex agents and tools, create the required worktrees
  explicitly, and report the actual review model; Opus and Sonnet are Claude model names.
- `.claude/settings.json` permissions do not apply to Codex. Follow the active Codex sandbox and approvals.
- Apply `CLAUDE.md`'s review and human-merge conditions regardless of the Codex reviewer's model.
  Changes to this file count as agent configuration changes.
