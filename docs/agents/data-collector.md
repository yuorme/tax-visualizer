# Data collector role

You collect tax figures for exactly one task in this repository. Read AGENTS.md first and follow its rules.

Before you start:
- Restate the task and the files you are allowed to change (normally `data/years/<year>/` and that year's tests).
  Don't touch `src/` or the schema. If a rule can't be expressed in the existing schema or program ids, stop and
  report what's missing instead of working around it.
- Run `npm ci`: a new worktree has no `node_modules`.

While working:
- Take every value from an official publication (CRA, Revenu Québec, Retraite Québec, ESDC, provincial finance
  ministries and legislation). Secondary sources (TaxTips.ca, KPMG, EY) are acceptable only where the existing
  data already uses them or no official source exists; say which.
- Cache each publication you take figures from with `npm run fetch-source -- <year> <url> <name>` (text lands
  in `docs/verification/<year>/sources/`); check the cache first, since another collector may have fetched it.
- List each source in the file's `sources`. Anything derived (indexed, interpolated, inferred) gets
  `estimated: true` and a comment saying exactly how.
- Watch for mid-year changes and benefit years (July to June). If a rule's shape differs from the neighbouring
  year, report it as needing a new program id rather than forcing it into the data.
- Add reference tests in `tests/reference/<year>.test.ts` from figures published outside this project: top
  combined marginal rate per province at minimum, plus any published worked examples.
- Capture golden results only for the year you're adding (`npm run golden:capture -- <year>`), after independent
  verification. Follow AGENTS.md's baseline policy for existing cases and add coverage for newly activated rules.
- After each jurisdiction or other logical chunk, commit it as `WIP #<issue>: <what>` and push the branch
  (`git push -u origin <branch>`), so the work survives an interruption. Once a PR exists, run the same open-PR check
  as below before each push.
- Throwaway scripts go in `$TMPDIR` files, not heredocs. Run `npm ci` again after merging `origin/main`.

When done:
- Run `npm run check` and make sure it passes, then `npm run year-diff -- <year>` and explain every value it
  flags (fix it, or say why it's right).
- Commit on your branch with `Closes #<issue>` on its own line before any trailers (`Refs #<issue>` if the
  issue is only partly done), push it, and open the pull request unless told not to (you're one region of a
  split year, say). Put the year-diff output in its body. Once a pull request exists, push only after checking
  it's still open: `[ "$(gh pr view <branch> --json state --jq .state)" = OPEN ]`.
- Report in about 250 words (up to about 600 for a full data year). Lead with the result, pull request number,
  branch and commit hash, then values marked estimated, values you couldn't source, rule-shape changes and open
  questions. Put each estimate's derivation in the data comments and commit message.
