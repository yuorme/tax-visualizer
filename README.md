# Provincial Tax Compare

Compares the full yearly tax burden of a household across Canada's 13 provinces and territories: federal and
provincial income tax, CPP/QPP, EI and health premiums, sales tax and property tax, net of child benefits and
refundable credits. Enter a household once and see every province side by side, plus a detailed comparison of
your home province with a destination.

The app is a single static page. There is no server and no database: the tax parameters for each year are
plain YAML files in `data/`, versioned with the code.

## Quick start

Requires Node 22.6 or later.

```sh
npm install
npx playwright install chromium   # once, for the browser tests
npm run check                     # typecheck, tests, build, browser smoke test
open dist/index.html
```

| Command | What it does |
|---|---|
| `npm run build` | Validates the data and writes `dist/index.html`, a single self-contained page |
| `npm run dev` | Rebuilds on every change to `src/` or `data/` |
| `npm test` | Data validation, golden results and published reference values |
| `npm run typecheck` | TypeScript checks for the engine, data schema, tests and scripts |
| `npm run e2e` | Loads the built page in Chromium on desktop and phone widths |

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
src/ui/                 page markup, styles and the page logic (app.js)
scripts/build.ts        bundles everything into dist/index.html with esbuild
tests/                  see "How the numbers are checked"
legacy/                 the original single-file app, kept as the reference for the golden tests
assets/flags/           public-domain flag sources; scripts/make-flags.mjs makes the waving icons
docs/                   ROADMAP.md (what's next), SCOPE.md (what's modelled), verification/ (audits)
CLAUDE.md, .claude/     project rules and agent definitions for Claude Code
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
- **Golden results** (`tests/golden.test.ts`): 148 households × 13 provinces (singles, couples, single
  parents, up to six children, investment income, deductions, renters and owners) must reproduce
  `tests/golden/2026.json` to the hundredth of a cent. The fixture was captured from the original app
  before the refactor. A change here means a result changed: if it's intended, explain it in the commit and
  re-capture.
- **Reference values** (`tests/reference.test.ts`): results compared with figures published outside this
  project, such as each province's top marginal rate and Ontario's top dividend rates.
- **Browser smoke test** (`tests/e2e/smoke.mjs`): the built page loads without errors at 1000, 430 and 375 px
  wide, doesn't scroll sideways on phones, and shows exactly the same figures as the legacy page after a series
  of inputs.

## Adding a year

1. Copy `data/years/<latest>/` to `data/years/<new year>/` and update `year` in `federal.yaml`.
2. Update every amount from CRA's rate pages, the T4127 payroll formulas, the T4114 benefits booklet and each
   province's budget. Keep the `sources` lists current and mark estimates with `estimated: true`.
3. If a program changed shape, add a new program id in the engine and the schema, and point the year's data at it.
4. Add reference tests for the new year from published figures (top marginal rates at minimum).
5. Once the year is verified, capture its golden results so later changes can't move them silently.

## What's next

See `docs/ROADMAP.md`, and `docs/SCOPE.md` for what the model includes and leaves out.
