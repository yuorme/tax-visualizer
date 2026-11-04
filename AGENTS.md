# Provincial Tax Compare

Static single-page app comparing a household's full yearly tax burden across Canada's 13 provinces and
territories. No server, no database: tax parameters are YAML files in `data/years/<year>/`, the engine is pure
TypeScript, and the build inlines everything into `dist/index.html`. See README.md for the layout and the full
command table.

These are the shared instructions for every agent: Codex reads this file directly, Claude Code through `CLAUDE.md`.
Role instructions are in `docs/agents/`; tool-specific notes are at the end.

## The user
A data scientist, fluent in Python and SQL, newer to JavaScript, TypeScript and npm. Explain JS tooling by Python
analogy (fnm ≈ pyenv, `package-lock.json` ≈ `uv.lock`, `npm ci` ≈ `uv sync --frozen`, `node_modules` ≈ `.venv`).
Python is welcome for verification and analysis tooling; the engine stays TypeScript.

## Commands
- `npm run check` — lint, typecheck, tests, build, browser smoke test. Required except for the Markdown-only path
  under Validation.
- `npm run format` — apply Biome's formatting and safe lint fixes. `npm run lint` also fails Markdown prose lines
  over 120 characters.
- `npm test` — data validation, golden results, published reference values (Node's built-in test runner). Runs
  every `tests/**/*.test.ts`; reference tests are one file per year in `tests/reference/<year>.test.ts`.
- `npm run golden:capture -- <year>` — capture one year's `tests/golden/<year>.json` from the engine. Refuses to
  overwrite without `--force`; never touches other years.
- `npm run compare -- <git-ref>` — build the page at a ref and at the working tree, walk both through the smoke
  steps at 375, 430 and desktop width in light and dark, and diff visible text and control state.
- `npm run preview [-- <PR#|branch>]` — build a PR, ref or this checkout; open it at 375, 430, desktop, dark and light.
- `year-diff`, `fetch-source`, `worktree:cleanup`, `golden:capture-legacy` and the rest: README.md's table.

## Validation
Markdown-only changes in root `*.md`, `docs/**/*.md` and `.claude/agents/*.md` use lightweight validation:
run `node scripts/check-scope.mjs origin/<base> HEAD`; when it reports `docs_only=true`, run
`node scripts/check-docs.mjs` instead of installing dependencies or running `npm run check`. The scope check
includes local edits and untracked files. Any other path, mixed change, empty diff or unknown comparison uses
`npm ci` and `npm run check`. CI keeps the required `check` job, validates Markdown, and skips application checks
and deployment for Markdown-only PRs and pushes. Independent review and human-merge conditions still apply.

## Toolchain
- **Node 26** (Active LTS from Oct 2026, supported to Apr 2029), pinned by major in `.node-version`; CI reads the
  same file. `.npmrc` sets `engine-strict`, so the wrong Node fails `npm ci` instead of warning. Locally, fnm
  switches versions on `cd`. In agent shells, run commands as `fnm exec --using=26 <cmd>` (sandboxes refuse
  `eval "$(fnm env)"`) — the system `node` on this machine is v16.
- **Dependencies are pinned exactly** in `package.json` and `package-lock.json` is committed. Install with
  `npm ci`; use `npm install -E <pkg>@<version>` only to add or upgrade, and commit the lockfile with it.
  `@types/node` tracks the Node major.
- **npm 11 runs install scripts only for packages listed in `allowScripts`** (esbuild, fsevents), keyed by
  version. After upgrading one of them, run `npm install-scripts approve <pkg>` (or the install warns), then
  `npm install-scripts prune` to drop the old version's entry.
- **TypeScript (7) only typechecks.** `tsx` and esbuild strip types without checking them, so a compiler upgrade
  can't change the built page. Upgrades that touch output (esbuild, zod, yaml) should leave `dist/index.html`
  byte-identical, or explain why not.
- **Biome formats and lints** `src/`, `tests/` and `scripts/` (2 spaces, 120 columns; it doesn't format HTML or
  YAML, but does lint `index.html`). Run `npm run format` before committing. The whole codebase was reformatted in
  one commit listed in `.git-blame-ignore-revs`; run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once
  so `git blame` skips it.
- **New lint findings** (Biome minor releases add recommended rules, and warnings fail CI): fix the code if the rule
  makes sense here. If a few lines need the flagged pattern on purpose, suppress it for those lines with a comment
  saying why (`biome-ignore`, as in `tests/e2e/smoke.mjs`). Switch a rule off in `biome.json` only if it never
  fits this codebase.
- **zod 4 rejects `Infinity` in `z.number()`.** Bracket limits use `.inf` in YAML, so the schema allows
  `z.literal(Infinity)` explicitly.
- Upgrade on a dedicated branch, not mid-feature. Move to the next Node major when it reaches Active LTS (each
  October; from v27 every major becomes LTS).

## Rules that keep the numbers trustworthy
- **Numbers live in data, formulas in code.** No amounts, rates or thresholds in `src/engine/` or `src/ui/`.
  Read them from the year's data. When a rule changes shape, add a new `program` id; don't add year checks
  inside an existing formula.
- **Every data value is sourced.** Keep `sources` lists current. Anything not taken directly from an official
  publication gets `estimated: true` and a comment saying how it was derived.
- **Existing golden tests are locked.** Preserve their inputs, expected values, assertions and tolerances.
  Never re-capture, delete, skip or weaken them to make a failure pass. Changing an existing case is allowed only
  when an independently verified data/rule correction or task-required behavior change makes it unavoidable. Document
  the evidence, affected cases and before/after values in the commit and PR; change only those cases, preserving
  unrelated baselines. Diagnose unexpected failures before changing any expectation; intention alone is insufficient.
- **New engine behavior needs new golden cases in the same PR**, alongside targeted correctness tests. Add separate
  fixtures for new features/rule paths without rewriting existing baselines. Verify new expected values against
  published examples or documented independent calculations; engine-generated snapshots alone prove no correctness.
  Review must map every changed rule path to a golden case that exercises it, including material boundaries.
- **New years need reference tests** from figures published outside this project (top marginal rates at minimum).
- **The engine never touches the DOM**, and the UI never computes tax.

## UI conventions
- Must work at 375 px and 430 px wide with no sideways scrolling, in light and dark mode.
- Explanations go in info tooltips, not visible hint text. Chart columns use two-letter codes.
- Keep the page a single self-contained file (it's also published as an artifact).

## Planning and scope
- Work is tracked in GitHub Issues; scope decisions in `docs/SCOPE.md`.
- Past verification work: `docs/verification/`.

## Who does what
Claude Code plans and orchestrates; Codex does most of the hands-on engine and data work.

| Work | Agent | Role file in `docs/agents/` |
| --- | --- | --- |
| Planning, issue scoping, dispatch, merge decisions, retros | Claude (main session) | — |
| UI and layout: design, code and review | Claude | `coder.md`, `reviewer.md` |
| Engine, rules, schema, scripts, tests, debugging | Codex | `coder.md` |
| A year's or a program's figures | Codex | `data-collector.md` |
| Review of engine, data and script changes | Codex, in a session that didn't write it | `reviewer.md` |

An issue touching both UI and engine is split into stacked branches (engine first), or goes to whoever owns most
of it, with the other agent reviewing.

## Running agents
The orchestrator gives each agent one issue, its role file and an explicit list of files it owns; never run two
agents on the same file at once. Exception: in `src/data/schema.ts`, adding new fields or program entries doesn't
need exclusive ownership (editing existing ones does). Each agent works in its own git worktree under
`.claude/worktrees/`, branched from `origin/main`, never in the main checkout another session may be using. Every
branch gets a reviewer pass before it merges; give the reviewer the pull request number from the agent's report.

The orchestrator owns worktree cleanup: lock each agent's worktree while it is active (`git worktree lock <path>`).
After its final report and process exit, unlock it and run `npm run worktree:cleanup -- --apply <path>` from outside
it, including reviewer checkouts and PRs awaiting `needs-human` merge. Keep unfinished work; recreate a checkout
for follow-ups. At session start, inspect leftover worktrees and clean only confirmed finished ones. See
[Worktree lifecycle](README.md#worktree-lifecycle) for safeguards, paused work and preview cleanup.
When one issue needs another's unmerged work, branch from that branch (stacked), open the pull request against it
(GitHub retargets it to `main` when the parent merges), and say so in "Blocked by".

A data year can be split across parallel data-collectors by region (federal; BC, AB, SK, MB; ON, QC; Atlantic;
territories), each owning its own `data/years/<year>/` files on its own branch. One of them, usually federal, is
told to merge the others' branches when they finish, then writes the reference tests, captures the golden
results and opens the one pull request that gets reviewed. Collectors cache what they read with
`npm run fetch-source` in `docs/verification/<year>/sources/`, so reviewers check figures against the same text.

## Milestone retros
When a milestone's last pull request merges, the orchestrator writes `docs/retros/<milestone>.md`: per issue, the
agent (Claude or Codex) and its tokens, review rounds to approval and what the extra rounds fixed; defects found
after merge; and time lost to blocking or interruptions. It proposes at most three process changes, each tied to a
number in the retro, in one pull request for the user. Each change should also remove or merge a rule where it
can: keep this file under about 160 lines, `CLAUDE.md` under about 40 and each role file under about 45. Drop a
rule that a later retro shows had no effect.

## Merging
`main` only changes through pull requests, and the `check` CI job must pass first (an admin can bypass in an
emergency). The agent that finishes a branch pushes it and opens the pull request (`gh pr create`, body says
`Closes #N`); the orchestrator then runs the reviewer, which posts its verdict on the pull request, and sends any
findings to fix back to the same agent. Use merge commits, not squash or rebase, so commit hashes survive
(`.git-blame-ignore-revs` lists formatting commits by hash).

Once the pull request is final (reviewer approved, no open should-fix findings, no more commits planned), the
orchestrator says so and queues it with `gh pr merge N --auto --merge`; GitHub merges it once CI passes (at once if
it already has) and the repo deletes the branch. Engine and rule changes follow this path once the reviewer verifies
the golden-test requirements above; the reviewer's model alone does not require human review or human merge.
The user merges instead, and the orchestrator labels the pull request `needs-human` and says so, when:
- its issue is labelled `needs-human`, or
- it makes significant layout changes, or
- it changes this merge process, `AGENTS.md`, `CLAUDE.md`, `docs/agents/`, `.claude/agents/`, `.claude/settings.json`
  or `.codex/`.

After queueing, push nothing except `gh pr update-branch N`: extra commits would merge unreviewed once CI passes, so
to add some, cancel first with `gh pr merge N --disable-auto`. The "branches must be up to date" rule on `main`
stays (the user prefers testing every combination; a merge queue would need a GitHub organization), so a queued pull
request stalls when another merges first; `gh pr update-branch N` brings it current and it merges after CI. A failed
check leaves it open. Dependabot opens monthly update pull requests; each gets a reviewer pass and is then queued
the same way, treated like an upgrade branch (see Toolchain).

The user may merge while an agent is still working. Gate every push on the pull request being open, as a condition
rather than a printed value: `[ "$(gh pr view N --json state --jq .state)" = OPEN ] && git push`. Pass the same gate
to any agent sent review fixes. Wrap every CI wait in `timeout` or a fixed number of polls.

## Tool notes
- **Codex:** `.claude/` files don't configure Codex (models, tools, isolation, permissions); `.codex/hooks.json`
  does. Create worktrees explicitly, follow the active sandbox and approvals, and put your actual model in review
  headers.
- **Claude Code:** see `CLAUDE.md`.
