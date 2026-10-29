# Provincial Tax Compare

Static single-page app comparing a household's full yearly tax burden across Canada's 13 provinces and
territories. No server, no database: tax parameters are YAML files in `data/years/<year>/`, the engine is pure
TypeScript, and the build inlines everything into `dist/index.html`. See README.md for the layout.

## Commands
- `npm run check` — typecheck, tests, build, browser smoke test. Must pass before any merge.
- `npm test` — data validation, golden results, published reference values (Node's built-in test runner).
- `npm run build` / `npm run dev` — single-file build / rebuild on change.
- `node scripts/make-flags.mjs` — regenerate the waving flag icons from `assets/flags/source/`.

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
- Current plan and feature ideas: `docs/ROADMAP.md` (changes often; treat it as a starting point, not a spec).
- What the model includes and leaves out, and why: `docs/SCOPE.md`. These are prototype-stage choices and open
  to revisiting.
- Past verification work: `docs/verification/`.

## Working with agents
The main session orchestrates; `.claude/agents/` defines a `coder` (works in its own git worktree) and a
`reviewer` (read-only, runs the checks). Give each coder one task and an explicit list of files it owns; never
run two coders on the same file at once. Every branch gets a reviewer pass before it merges.
