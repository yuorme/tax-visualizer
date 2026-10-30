# Provincial Tax Compare

Static single-page app comparing a household's full yearly tax burden across Canada's 13 provinces and
territories. No server, no database: tax parameters are YAML files in `data/years/<year>/`, the engine is pure
TypeScript, and the build inlines everything into `dist/index.html`. See README.md for the layout.

## Commands
- `npm run check` — typecheck, tests, build, browser smoke test. Must pass before any merge.
- `npm test` — data validation, golden results, published reference values (Node's built-in test runner).
- `npm run build` / `npm run dev` — single-file build / rebuild on change.
- `node scripts/make-flags.mjs` — regenerate the waving flag icons from `assets/flags/source/`.

## Toolchain
- **Node 26** (Active LTS from Oct 2026, supported to Apr 2029), pinned by major in `.node-version`; CI reads the
  same file. `.npmrc` sets `engine-strict`, so the wrong Node fails `npm ci` instead of warning. Locally, fnm
  switches versions on `cd`. In agent shells, prefix commands with
  `eval "$(fnm env --shell bash)" && fnm use >/dev/null &&` — the system `node` on this machine is v16.
- **Dependencies are pinned exactly** in `package.json` and `package-lock.json` is committed. Install with
  `npm ci`; use `npm install -E <pkg>@<version>` only to add or upgrade, and commit the lockfile with it.
  `@types/node` tracks the Node major.
- **npm 11 runs install scripts only for packages listed in `allowScripts`** (esbuild, fsevents), keyed by
  version. After upgrading one of them, run `npm install-scripts approve <pkg>` (or the install warns), then
  `npm install-scripts prune` to drop the old version's entry.
- **TypeScript (7) only typechecks.** `tsx` and esbuild strip types without checking them, so a compiler upgrade
  can't change the built page. Upgrades that touch output (esbuild, zod, yaml) should leave `dist/index.html`
  byte-identical, or explain why not.
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
- **Golden results are locked.** `tests/golden/<year>.json` must not change unless the change is intended. If it
  is (a data correction or rule fix), say exactly what changed and why in the commit, then re-capture.
- **New years need reference tests** from figures published outside this project (top marginal rates at minimum).
- **The engine never touches the DOM**, and the UI never computes tax.

## UI conventions
- Must work at 375 px and 430 px wide with no sideways scrolling, in light and dark mode.
- Explanations go in info tooltips, not visible hint text. Chart columns use two-letter codes.
- Keep the page a single self-contained file (it's also published as an artifact).

## Planning and scope
- Work is tracked in GitHub Issues; scope decisions in `docs/SCOPE.md`.
- Past verification work: `docs/verification/`.

## Working with agents
The main session orchestrates; `.claude/agents/` defines a `coder` (Opus, code changes in its own git worktree),
a `data-collector` (Sonnet, a year's figures from official sources, also in a worktree) and a `reviewer` (Sonnet,
read-only, runs the checks). For reviews of engine or rule changes, pass `model: opus` on the call. Give each
agent one issue and an explicit list of files it owns; never run two agents on the same file at once. Every branch
gets a reviewer pass before it merges; give the reviewer the branch name or commit hash from the agent's report.
New worktrees start from `origin/main`, not local `main`, so push `main` before starting an agent. A new
worktree has no `node_modules`, so agents run `npm ci` first.
