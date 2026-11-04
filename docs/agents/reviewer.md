# Reviewer role

You review one branch against `main` in a fresh session with no shared coder context. Don't edit files.

Steps:
1. You start in your own worktree. After `git fetch`, run `git checkout --detach <commit>` for the pull request's
   head (`gh pr view N --json headRefOid,baseRefName`); a plain `git checkout <branch>` fails because the author's
   worktree holds the branch. Read AGENTS.md (the branch's copy), the task, and `git diff origin/<base>...HEAD`
   (never a local branch, which may be stale). Flag a data pull request whose sources aren't cached.
2. Follow AGENTS.md's validation path: Markdown-only changes run the scope and Markdown checks; all others run
   `npm ci`, then `npm run check`. A failure is a blocking finding.
3. Check the rules in AGENTS.md:
   - No amounts, rates or thresholds added to `src/engine/` or `src/ui/`.
   - Every new or changed data value has a source; derived values are marked `estimated: true`.
   - Existing golden inputs, expectations and checks follow AGENTS.md's baseline policy; explanation alone is
     insufficient. Verify any unavoidable correction independently, including its affected cases and values.
     Run your own golden diff to confirm PR cell and case counts by year and province and that only expected
     cells moved. Recompute a sample independently of the engine; check the verification note's reasoning,
     sources and calculations, including PR explanations of cells combining two changes.
   - Every new/changed engine rule path has golden coverage in this PR, with independently checked expectations
     and material boundaries; passing old fixtures or capturing engine output alone does not establish coverage.
   - New data years have reference tests from outside sources.
4. Spot-check any new or changed figures against their listed sources where you can, using the cached text in
   `docs/verification/<year>/sources/` first. For a data year, check each value the pull request's year-diff
   output flags.
5. For UI changes, run `npm run compare -- origin/main` first: it diffs visible text and control state at
   375 px, 430 px and desktop width in light and dark. Take Playwright screenshots only for what text can't
   show (layout, colour), opening the page with `openPage` and `settle` from `tests/e2e/page.mjs`, which wait
   for the Google Fonts. Before reporting a pixel difference, rerun the capture once; a difference that doesn't
   repeat is font timing. If the fonts can't be reached (offline), say so instead of reporting pixel differences.
6. Check that the change does what the task asked and nothing more.

Throwaway scripts go in files under `$TMPDIR`, not heredocs.

Report in about 250 words (up to about 600 for engine or rule changes, a full data year or multi-file
refactors). Report findings, what was checked and counts, without reproducing a cell list.
Lead with the verdict (approve or request changes) and the commit reviewed, then findings grouped
as blocking / should fix / minor, each with file, line and a suggested fix. Post the same report as a comment on
the pull request (`gh pr comment <N> --body-file <file>`), headed
"Reviewer verdict (<your actual model>)", adding ", same-agent review" when the brief says your agent wrote the
branch, and return it.
