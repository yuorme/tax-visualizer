# Provincial Tax Compare

Compares the full yearly tax burden of a household across Canada's 13 provinces and territories: federal and
provincial income tax, CPP/QPP, EI and health premiums, sales tax and property tax, net of child benefits and
refundable credits. Enter a household once and see every province side by side, plus a detailed comparison of
your home province with a destination.

The app is a single static page. There is no server and no database: the tax parameters for each year are
plain YAML files in `data/`, versioned with the code.

## Quick start

Requires Node 26 (pinned in `.node-version`). With [fnm](https://github.com/Schniz/fnm) set up
(`eval "$(fnm env --use-on-cd --shell zsh)"` in `~/.zshrc`), the right version is picked up when you enter the folder.

```sh
fnm install                       # once, installs the Node version in .node-version
npm ci                            # installs exactly what package-lock.json lists
npx playwright install chromium   # once, for the browser tests
npm run check                     # lint, typecheck, tests, build, browser smoke test
open dist/index.html
```

| Command | What it does |
|---|---|
| `npm run build` | Validates the data and writes `dist/index.html`, a single self-contained page |
| `npm run dev` | Rebuilds on every change to `src/` or `data/` |
| `npm test` | Data validation, golden results and published reference values |
| `npm run lint` | Biome lint and formatting check, and no Markdown prose line over 120 characters |
| `npm run format` | Applies Biome's formatting and safe lint fixes |
| `npm run typecheck` | TypeScript checks for the engine, data schema, tests and scripts |
| `npm run e2e` | Loads the built page in Chromium on desktop and phone widths |
| `npm run compare -- <git-ref>` | Diffs the page's visible text and control state at a ref against the working tree |
| `npm run preview [-- <PR#\|branch>]` | Opens a pull request, ref or this checkout in phone and desktop windows, dark and light |
| `npm run worktree:cleanup -- [--apply] <path>...` | Checks explicitly named finished worktrees; `--apply` removes eligible checkouts and their generated files, preserving branches |
| `npm run golden:capture -- <year>` | Captures `tests/golden/<year>.json` from the engine; `--force` overwrites |
| `npm run golden:capture-legacy` | How 2026 was first locked: reruns the original app in `legacy/` |
| `npm run year-diff -- <year> [<base-year>]` | Markdown report of a year's data against the previous year: changes, large changes, amounts left unchanged (likely carried over), added and removed fields. A `# not indexed` comment marks an amount that is meant to stay the same |
| `npm run fetch-source -- <year> <url> [<name>]` | Caches a text extract of an official PDF, web page or text file in `docs/verification/<year>/sources/<name>.txt` and adds its row (title, URL, date, SHA-256 of the original) to `INDEX.md` there. The original isn't kept; extracts over 250 KB are refused, so pass `--pages 3-7,12` for a large PDF. `--force` replaces an extract, `--title` sets its title |

## Agent test output

Project hooks in `.codex/hooks.json` and `.claude/settings.json` share `scripts/trim-test-output.py`.
They apply to main sessions and all subagent roles in this checkout, including new worktrees containing these files.
They need Python 3.9 or newer. In Codex, review and trust the project hook using `/hooks` or Settings > Hooks;
in Claude Code, review the project hook in `/hooks`. Restart existing sessions to reload changed hook settings.

The filter recognizes `npm test`, `npm run check`, and direct `node --test` commands, including
`fnm exec --using=26` wrappers and `cd` within this checkout. It removes recognized passing-test chatter, retains
unknown text, and preserves everything from the first failure or warning onward. A private temporary log keeps
the original output; its path appears first in the shortened result. Logs follow normal OS temp-file lifetime.
Codex replacements include the exit code; Claude replacements preserve the Bash result metadata and report when
no exit code was supplied. Tests, shell commands, approvals and exit codes are unchanged.

Incomplete, already-truncated, small or unfamiliar results pass through unchanged. Claude tool failures also pass
through unchanged because its failure hook does not support output replacement. Output seen in earlier streaming
polls cannot be removed retroactively. Disable this filter in the client's `/hooks` menu.

Run its regression suite with `npm run test:hooks` (also included in `npm run check`). Hook contracts:
[Codex](https://learn.chatgpt.com/docs/hooks) and [Claude Code](https://code.claude.com/docs/en/hooks).

## Worktree lifecycle

Each isolated agent checkout can install about 150 MB of dependencies. A pushed branch or PR retains the work;
the checkout is disposable once its agent has reported and stopped, even while the PR awaits human merge.
The orchestrator locks active worktrees and unlocks only its own completed ones. These locks and the owner's
confirmation that the task stopped protect active work. Process inspection checks only working directories:
an idle agent or a preview launched from the repo root may not be detected, so this check cannot establish completion.

Run from another checkout with Node 26 and `lsof` installed (macOS or Linux):

```sh
git worktree list
npm run worktree:cleanup -- /absolute/path/to/finished-worktree
npm run worktree:cleanup -- --apply /absolute/path/to/finished-worktree
```

The command fetches origin, then requires HEAD to be reachable from an origin branch. It keeps the main/current
checkout, locked worktrees, worktrees containing process working directories or nested registered worktrees,
local-only commits, tracked changes, untracked files and unknown ignored files. It also refuses `assume-unchanged`
and `skip-worktree` index flags, which can hide edits from Git's status and removal checks, leaving the flags intact.
Only ignored `node_modules`, `dist`, `coverage`, `test-results`, `playwright-report` and `.DS_Store` metadata files
are disposable. A failed fetch or process check stops cleanup. It uses `git worktree remove` without force,
preserves branch refs, and performs a dry run unless `--apply` is given.
Use explicit paths owned by the completed task; a broad directory sweep can disrupt another session.

Keep dirty or unpushed worktrees until their work is preserved. For paused work, once the owner confirms all
processes have stopped, reclaim only reinstallable dependencies with
`node -e 'require("node:fs").rmSync(process.argv[1], {recursive:true, force:true})' /absolute/worktree/node_modules`.
Check that exact path first. Before resuming, follow AGENTS.md's validation path; reinstall dependencies when full
checks apply. Keep source caches and reports.

After closing preview windows and stopping the preview process, run
`npm run worktree:cleanup -- --apply /absolute/path/to/repo/.preview`.
If a preview contains local-only commits, preserve it or use the paused-work dependency cleanup instead.

## How it's organized

```
data/years/<year>/
  federal.yaml          federal brackets, credits, CPP/EI, Canada Child Benefit, Workers Benefit...
  provinces/<XX>.yaml   one file per province or territory
src/data/               schema (zod) and loader; every file is validated before tests and builds
src/engine/             the tax engine: pure functions, no DOM
  personal.ts           income tax and payroll for one person
  household.ts          spouse and dependant amounts, benefits, credits, sales and property tax, marginal rates
  benefits.ts           Canada Child Benefit and provincial child benefits
  credits.ts            refundable credits
src/ui/                 page markup, styles and the page logic (app.ts)
scripts/build.ts        bundles everything into dist/index.html with esbuild
tests/                  see "How the numbers are checked"
legacy/                 the original single-file app, kept as the reference for the golden tests
assets/flags/           public-domain flag sources; scripts/make-flags.mjs makes the waving icons
docs/                   SCOPE.md (what's modelled), verification/ (audits), agents/ (agent roles)
AGENTS.md               shared rules for every coding agent; CLAUDE.md adds Claude Code notes
.claude/, .codex/       agent registrations, settings and hooks for Claude Code and Codex
```

**Rules in code, numbers in data.** Formulas live in the engine; every amount, rate and threshold lives in the
YAML files. Where provinces differ in *how* something is calculated, the data names the formula with a `program`
id and gives its parameters, for example:

```yaml
childBenefit:
  name: Ontario Child Benefit
  program: ontario-child-benefit
  params: {perChild: 1760, threshold: 26865, rate: 0.08}
```

When a rule changes shape in a later (or earlier) year, add a new program id with its own formula rather than
adding year checks inside an existing one. Values that are estimates rather than published figures carry
`estimated: true`.

## How the numbers are checked

- **Data validation** (`tests/data.test.ts`, `src/data/schema.ts`): every file must match the schema, with
  increasing bracket limits, rates between 0 and 1, known program ids and all 13 jurisdictions.
- **Golden results** (`tests/golden.test.ts`): for every year in `data/years/`, 148 households × 13 provinces
  (singles, couples, single parents, up to six children, investment income, deductions, renters and owners) must
  reproduce `tests/golden/<year>.json` to the hundredth of a cent. A year without a fixture fails the test. A
  change here means a result changed: diagnose it using the golden-baseline policy in [AGENTS.md](AGENTS.md).
  Existing cases stay locked; new engine behavior needs additive golden cases with independently checked expectations.
  - `npm run golden:capture -- <year>` captures one year's fixture from the engine. It writes only that year's
    file and refuses to replace an existing one unless given `--force`; `--out <file>` writes elsewhere.
  - `npm run golden:capture-legacy` (`tests/golden/capture-legacy.mjs`) is how `2026.json` was first locked:
    it runs the original single-file app in `legacy/`, which only knows 2026. Capturing 2026 from the engine
    writes the same bytes except the `source` field, which names the engine instead of the legacy app.
- **Feature goldens** (`tests/golden-features.test.ts`): additive cases in `tests/golden/features/` lock new inputs,
  rule paths and nested outputs without replacing yearly baselines. Expected values use independent calculations;
  there is no capture mode. See the [coverage audit](docs/verification/golden-coverage.md) for cases and derivations.
- **Reference values** (`tests/reference/<year>.test.ts`, one file per year, which takes its year from the file
  name): results compared with figures published outside this project, such as each province's top marginal
  rate and Ontario's top dividend rates.
- **Browser smoke test** (`tests/e2e/smoke.mjs`): the built page loads without errors at 1000, 430 and 375 px
  wide in both themes and doesn't scroll sideways on phones. Legacy comparisons retain all three widths.
  Detailed functional flows (including every tax year, validation and persistence cases) run once at desktop width.
  A compact responsive flow checks each panel, expanded childcare controls, invalid drafts, history and a year switch
  across all six width/theme pairs. Contrast scans cover these visual states at 375 px in light and dark mode.
  Numeric permutations are not repeated across the whole matrix; add new visual states to `tests/e2e/responsive.mjs`
  when a feature introduces distinct controls or styling. The runner reports page, state and contrast-scan counts.

## Adding a year

1. Copy `data/years/<latest>/` to `data/years/<new year>/` and update `year` in `federal.yaml`.
2. Update every amount from CRA's rate pages, the T4127 payroll formulas, the T4114 benefits booklet and each
   province's budget. Keep the `sources` lists current and mark estimates with `estimated: true`.
3. If a program changed shape, add a new program id in the engine and the schema, and point the year's data at it.
4. Add `tests/reference/<new year>.test.ts` with figures published outside this project (top marginal rates at
   minimum). Copying the previous year's file is a good start; replace every expected value.
5. Once the year is verified, run `npm run golden:capture -- <new year>` so later changes can't move its results
   silently. `npm test` fails until the fixture exists.

## What's next

See the [GitHub issues](https://github.com/yuorme/tax-visualizer/issues), and `docs/SCOPE.md` for what the model
includes and leaves out.

## License

Code and data are MIT, see `LICENSE`. Tax figures come from the government publications listed in each data file's
`sources`. The flag sources in `assets/flags/source/` are public domain.
